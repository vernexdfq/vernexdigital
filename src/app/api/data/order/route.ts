import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

type VerxorPlan = {
  id: number;
  network: string;
  size: string;
  days: string;
  tab: string;
  price: number; // child (wholesale) price
  retail: number; // face value — what the panel customer pays
};

/**
 * POST /api/data/order
 * Debit panel customer at face (retail) → Verxor panel API debits the
 * reseller wallet at child (wholesale) price → refund on fail.
 * Price is always resolved server-side from Verxor — client price is never trusted.
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
    return NextResponse.json({ ok: false, error: "Sign in to buy data." }, { status: 401 });
  }

  let body: { network?: string; planId?: number | string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const network = String(body.network || "").toLowerCase().trim();
  if (!["mtn", "glo", "airtel", "9mobile"].includes(network)) {
    return NextResponse.json({ ok: false, error: "Invalid network" }, { status: 400 });
  }
  const planId = Number(body.planId);
  if (!Number.isFinite(planId) || planId <= 0) {
    return NextResponse.json({ ok: false, error: "Select a data plan first." }, { status: 400 });
  }
  const phone = String(body.phone || "").replace(/\s+/g, "");
  if (!phone || phone.replace(/\D/g, "").length < 10) {
    return NextResponse.json({ ok: false, error: "Enter a valid phone number" }, { status: 400 });
  }

  // Resolve plan + price from Verxor (server-side, never trust the client)
  let plan: VerxorPlan | null = null;
  try {
    const plansRes = await verxorFetch(`/data/plans?network=${network}`);
    const plansData = (await plansRes.json().catch(() => ({}))) as { plans?: VerxorPlan[] };
    plan = (plansData.plans || []).find((p) => Number(p.id) === planId) || null;
  } catch {
    plan = null;
  }
  if (!plan) {
    return NextResponse.json(
      { ok: false, error: "This data plan is not available right now. Please choose another bundle." },
      { status: 410 },
    );
  }
  const face = Math.round(Number(plan.retail) || Number(plan.price));
  if (!Number.isFinite(face) || face <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid plan price." }, { status: 400 });
  }

  const admin = createServerClient();
  const ref = `dt-${user.id.slice(0, 8)}-${Date.now()}`;
  const netLabel = network === "9mobile" ? "9mobile" : network.toUpperCase();

  const debited = await changeWalletBalance(admin, user.id, (b) =>
    b >= face ? b - face : null,
  );
  if (!debited.ok) {
    return NextResponse.json(
      { ok: false, error: "Insufficient wallet balance. Fund your wallet first." },
      { status: 402 },
    );
  }

  void admin.from("transactions").insert({
    user_id: user.id,
    kind: "data",
    title: `${netLabel} data ${plan.size} ₦${face.toLocaleString("en-NG")}`,
    amount: -face,
    status: "pending",
    meta: { network, phone, planId, face, ref },
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    let res: Response;
    try {
      res = await verxorFetch("/data", {
        method: "POST",
        body: JSON.stringify({ network, planId, phone, ref }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || data.ok === false) {
      await changeWalletBalance(admin, user.id, (b) => b + face);
      void admin.from("transactions").insert({
        user_id: user.id,
        kind: "refund",
        title: `Refund — ${netLabel} data ${plan.size}`,
        amount: face,
        status: "success",
        meta: { network, phone, planId, face, ref, reason: data.error || "provider_failed" },
      });
      return NextResponse.json(
        {
          ok: false,
          error: String(data.error || "Data purchase failed at provider"),
          refunded: true,
        },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
      );
    }

    const order = (data.order || {}) as Record<string, unknown>;

    await admin.from("transactions").insert({
      user_id: user.id,
      kind: "data",
      title: `${netLabel} data ${plan.size} ₦${face.toLocaleString("en-NG")} — success`,
      amount: -face,
      status: "success",
      meta: {
        network,
        phone,
        planId,
        face,
        ref: order.ref || ref,
        providerRef: order.ref,
        wholesale: data.balanceDebited,
        walletMode: data.walletMode,
      },
    });

    return NextResponse.json({
      ok: true,
      order: {
        ref: order.ref || ref,
        status: order.status || "successful",
        phone: order.phone || phone,
        amount: face,
        network: order.network || network,
        planName: order.planName || `${plan.size} (${plan.days} days)`,
        message: order.message || `${netLabel} data ${plan.size} purchase successful`,
      },
    });
  } catch (e) {
    await changeWalletBalance(admin, user.id, (b) => b + face);
    const aborted = e instanceof Error && e.name === "AbortError";
    const message = aborted
      ? "Data purchase timed out — wallet refunded. Try again."
      : e instanceof Error
        ? e.message
        : "Data purchase failed";
    void admin.from("transactions").insert({
      user_id: user.id,
      kind: "refund",
      title: `Refund — ${netLabel} data`,
      amount: face,
      status: "success",
      meta: { network, phone, planId, face, ref, reason: aborted ? "timeout" : "exception" },
    });
    return NextResponse.json({ ok: false, error: message, refunded: true }, { status: 502 });
  }
}
