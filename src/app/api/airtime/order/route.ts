import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** End-customer cashback on successful airtime (your rates). */
const CASHBACK: Record<string, number> = {
  mtn: 0.02,
  airtel: 0.02,
  "9mobile": 0.02,
  glo: 0.06,
};

async function getUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user || null;
}

async function changeWalletBalance(
  admin: ReturnType<typeof createServerClient>,
  userId: string,
  change: (balance: number) => number | null,
  attempts = 5,
): Promise<{ ok: boolean; balance?: number }> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data: wallet, error: readError } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (readError || !wallet) return { ok: false };
    const current = Number(wallet.balance) || 0;
    const next = change(current);
    if (next === null || !Number.isFinite(next) || next < 0) {
      return { ok: false, balance: current };
    }
    const rounded = Math.round(next * 100) / 100;
    const { data, error } = await admin
      .from("wallets")
      .update({ balance: rounded, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("balance", current)
      .select("balance");
    if (!error && data?.length) return { ok: true, balance: Number(data[0].balance) };
  }
  return { ok: false };
}

/**
 * POST /api/airtime/order
 * Debit customer → Verxor panel airtime API (same key as VN) → cashback on success.
 */
export async function POST(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." },
      { status: 503 },
    );
  }

  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to buy airtime." }, { status: 401 });
  }

  let body: { network?: string; phone?: string; amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const network = String(body.network || "").toLowerCase().trim();
  if (!["mtn", "glo", "airtel", "9mobile"].includes(network)) {
    return NextResponse.json({ ok: false, error: "Invalid network" }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount < 100) {
    return NextResponse.json({ ok: false, error: "Minimum airtime is ₦100" }, { status: 400 });
  }
  if (amount > 50000) {
    return NextResponse.json({ ok: false, error: "Maximum airtime is ₦50,000" }, { status: 400 });
  }

  const phone = String(body.phone || "").replace(/\s+/g, "");
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ ok: false, error: "Enter a valid phone number" }, { status: 400 });
  }

  const admin = createServerClient();
  const ref = `at-${user.id.slice(0, 8)}-${Date.now()}`;
  const netLabel = network === "9mobile" ? "9mobile" : network.toUpperCase();

  const debited = await changeWalletBalance(admin, user.id, (b) =>
    b >= amount ? b - amount : null,
  );
  if (!debited.ok) {
    return NextResponse.json(
      { ok: false, error: "Insufficient wallet balance. Fund your wallet first." },
      { status: 402 },
    );
  }

  await admin.from("transactions").insert({
    user_id: user.id,
    kind: "airtime",
    title: `${netLabel} airtime ₦${amount.toLocaleString("en-NG")}`,
    amount: -amount,
    status: "pending",
    meta: { network, phone, amount, ref },
  });

  try {
    const res = await verxorFetch("/airtime", {
      method: "POST",
      body: JSON.stringify({ network, phone, amount, ref }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || data.ok === false) {
      await changeWalletBalance(admin, user.id, (b) => b + amount);
      await admin.from("transactions").insert({
        user_id: user.id,
        kind: "refund",
        title: `Refund — ${netLabel} airtime`,
        amount: amount,
        status: "completed",
        meta: { network, phone, amount, ref, reason: data.error || "provider_failed" },
      });
      return NextResponse.json(
        {
          ok: false,
          error: String(data.error || "Airtime purchase failed at provider"),
          refunded: true,
        },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
      );
    }

    const order = (data.order || {}) as Record<string, unknown>;
    const cashbackRate = CASHBACK[network] || 0;
    const cashback = Math.round(amount * cashbackRate * 100) / 100;
    let cashbackCredited = 0;
    if (cashback > 0) {
      const cb = await changeWalletBalance(admin, user.id, (b) => b + cashback);
      if (cb.ok) {
        cashbackCredited = cashback;
        await admin.from("transactions").insert({
          user_id: user.id,
          kind: "cashback",
          title: `${netLabel} airtime cashback (${Math.round(cashbackRate * 100)}%)`,
          amount: cashback,
          status: "completed",
          meta: { network, phone, amount, cashback, ref },
        });
      }
    }

    await admin.from("transactions").insert({
      user_id: user.id,
      kind: "airtime",
      title: `${netLabel} airtime ₦${amount.toLocaleString("en-NG")} — success`,
      amount: -amount,
      status: "completed",
      meta: {
        network,
        phone,
        amount,
        ref: order.ref || ref,
        providerRef: order.ref,
        cashback: cashbackCredited,
      },
    });

    return NextResponse.json({
      ok: true,
      order: {
        ref: order.ref || ref,
        status: order.status || "successful",
        phone: order.phone || phone,
        amount: order.amount || amount,
        network: order.network || network,
        message: order.message || `${netLabel} airtime successful`,
        cashback: cashbackCredited,
        cashbackPercent: Math.round(cashbackRate * 100),
      },
    });
  } catch (e) {
    await changeWalletBalance(admin, user.id, (b) => b + amount);
    const message = e instanceof Error ? e.message : "Airtime failed";
    return NextResponse.json({ ok: false, error: message, refunded: true }, { status: 502 });
  }
}
