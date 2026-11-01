import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Partner margin is applied on Verxor. Customers pay face value. */

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
 * Debit customer (face) → Verxor panel API (wholesale margin) → refund on fail.
 * Tight path: no blocking ledger before provider; 45s abort on upstream.
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

  // Non-blocking pending log — do not delay provider call
  void admin.from("transactions").insert({
    user_id: user.id,
    kind: "airtime",
    title: `${netLabel} airtime ₦${amount.toLocaleString("en-NG")}`,
    amount: -amount,
    status: "pending",
    meta: { network, phone, amount, ref },
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    let res: Response;
    try {
      res = await verxorFetch("/airtime", {
        method: "POST",
        body: JSON.stringify({ network, phone, amount, ref }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || data.ok === false) {
      await changeWalletBalance(admin, user.id, (b) => b + amount);
      void admin.from("transactions").insert({
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

    void admin.from("transactions").insert({
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
        panelCharge: data.balanceDebited,
        walletMode: data.walletMode,
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
      },
    });
  } catch (e) {
    await changeWalletBalance(admin, user.id, (b) => b + amount);
    const aborted = e instanceof Error && e.name === "AbortError";
    const message = aborted
      ? "Airtime timed out — wallet refunded. Try again."
      : e instanceof Error
        ? e.message
        : "Airtime failed";
    void admin.from("transactions").insert({
      user_id: user.id,
      kind: "refund",
      title: `Refund — ${netLabel} airtime`,
      amount: amount,
      status: "completed",
      meta: { network, phone, amount, ref, reason: aborted ? "timeout" : "exception" },
    });
    return NextResponse.json({ ok: false, error: message, refunded: true }, { status: 502 });
  }
}
