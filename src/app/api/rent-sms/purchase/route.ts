import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { rentSmsCustomerNgn, rentSmsMultiplierFor } from "@/lib/rentsms-pricing";
import { getSharedRentSmsPricing } from "@/lib/rentsms-pricing-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function getUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anon || !token) return null;
  const auth = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await auth.auth.getUser();
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
 * POST /api/rent-sms/purchase
 *   { serviceName, duration, areaCode? }
 *
 * Panel customer flow: re-quote server-side via Verxor (never trust the
 * client price) → debit the panel wallet at panel retail pricing → buy the
 * rental wholesale from Verxor with the panel key (the parent debits our
 * reseller wallet) → refund on failure → save to rent_sms_orders + ledger.
 */
export async function POST(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json({ ok: false, error: "Rent-for-SMS is not configured on this panel yet." }, { status: 503 });
  }
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to rent a number." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    serviceName?: string;
    duration?: string;
    areaCode?: string | null;
  };
  const serviceName = String(body.serviceName || "").trim();
  const duration = String(body.duration || "").trim();
  if (!serviceName || !duration) {
    return NextResponse.json({ ok: false, error: "Missing service or duration." }, { status: 400 });
  }
  const areaCodeRaw = String(body.areaCode || "").trim();
  const areaCode = /^\d{3}$/.test(areaCodeRaw) ? areaCodeRaw : "";

  // Server-side re-quote: never trust a client-sent price.
  const { multipliers } = await getSharedRentSmsPricing();
  let customerPriceNgn = 0;
  let wholesaleNgn = 0;
  try {
    const q = await verxorFetch("/rent-sms/quote", {
      method: "POST",
      body: JSON.stringify({ serviceName, duration, areaCode: Boolean(areaCode) }),
    });
    const qd = (await q.json().catch(() => ({}))) as {
      ok?: boolean;
      priceNgn?: number;
      retailPriceNgn?: number;
      tier?: number;
      durationLabel?: string;
      error?: string;
    };
    if (!q.ok || !qd.ok || !Number(qd.priceNgn)) {
      return NextResponse.json(
        { ok: false, error: qd.error || "That option is not available right now. Try another duration." },
        { status: q.ok ? 404 : 502 },
      );
    }
    wholesaleNgn = Math.round(Number(qd.priceNgn) || 0);
    const tier = Math.min(Math.max(Number(qd.tier) || 1, 1), 5);
    customerPriceNgn = rentSmsCustomerNgn(wholesaleNgn, rentSmsMultiplierFor(tier, multipliers));
    if (!customerPriceNgn || customerPriceNgn <= 0) {
      return NextResponse.json({ ok: false, error: "Could not compute the price. Try again." }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Could not verify the price with Verxor. Try again." }, { status: 502 });
  }

  const retailTotal = customerPriceNgn;
  const admin = createServerClient();
  const ref = `rsm_${crypto.randomUUID()}`;

  // Best-effort ledger trail for reconciliation.
  async function writeLedger(status: string, extra: Record<string, unknown> = {}) {
    try {
      await admin.from("transactions").insert({
        user_id: userId,
        kind: "rent_sms",
        status,
        amount: -retailTotal,
        title: `Rent SMS — ${serviceName}${status === "success" ? "" : ` (${status})`}`,
        meta: { ref, serviceName, duration, areaCode: areaCode || null, retailTotal, wholesaleNgn, ...extra },
      });
    } catch {
      /* ledger is best-effort */
    }
  }

  const debit = await changeWalletBalance(admin, user.id, (b) => b - retailTotal);
  if (!debit.ok) {
    await writeLedger("rejected");
    return NextResponse.json({ ok: false, error: "Insufficient wallet balance. Fund your wallet first." }, { status: 402 });
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const userId = user.id;
  const customerName = typeof meta.full_name === "string" && meta.full_name.trim() ? meta.full_name.trim() : (user.email || "");

  let upstream: Response;
  let data: Record<string, any>;
  try {
    upstream = await verxorFetch("/rent-sms/purchase", {
      method: "POST",
      body: JSON.stringify({
        serviceName,
        duration,
        areaCode: areaCode || null,
        customerName,
        customerEmail: user.email || "",
        retailPriceNgn: retailTotal,
      }),
    });
    data = (await upstream.json().catch(() => ({}))) as Record<string, any>;
  } catch {
    // A timed-out request may already have been purchased upstream. Never blind-refund.
    await writeLedger("pending", { stage: "upstream_timeout" });
    return NextResponse.json(
      {
        ok: false,
        pending: true,
        reference: ref,
        error: `The provider response timed out. Your wallet remains reserved while this is reconciled. Do not retry yet; contact support with reference ${ref}.`,
      },
      { status: 202 },
    );
  }

  if (!upstream.ok || !data.ok || !data.rental) {
    const refund = await changeWalletBalance(admin, user.id, (b) => b + retailTotal);
    if (!refund.ok) {
      await writeLedger("pending", { stage: "refund_reconciliation", reason: String(data.error || "") });
      return NextResponse.json(
        {
          ok: false,
          pending: true,
          reference: ref,
          error: "The rental failed and the refund needs reconciliation. Contact support with reference " + ref,
        },
        { status: 202 },
      );
    }
    // Refund trail row — separate kind so earnings never counts it as a sale.
    try {
      await admin.from("transactions").insert({
        user_id: userId,
        kind: "rent_sms_refund",
        status: "success",
        amount: retailTotal,
        title: "Refund — Rent SMS",
        meta: { ref, serviceName, duration, reason: String(data.error || "") },
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json({ ok: false, error: data.error || "The rental failed. Your wallet has been refunded." }, { status: 502 });
  }

  const rental = (data.rental || {}) as Record<string, any>;
  const insert = await admin
    .from("rent_sms_orders")
    .insert({
      user_id: user.id,
      service_name: serviceName,
      duration: String(rental.duration || duration),
      area_code: areaCode || null,
      phone_number: String(rental.number || ""),
      reservation_id: String(rental.reservationId || ""),
      charged_ngn: retailTotal,
      wholesale_ngn: wholesaleNgn,
      status: "active",
      ends_at: rental.endsAt ? String(rental.endsAt) : null,
      client_reference: ref,
    })
    .select("id")
    .maybeSingle();

  await writeLedger("success", {
    reservationId: String(rental.reservationId || ""),
    panelCharge: wholesaleNgn,
  });

  return NextResponse.json({
    ok: true,
    warning: insert.error
      ? "Rental activated, but order history could not be saved. Copy your number and contact support."
      : undefined,
    rental: {
      ref,
      reservationId: String(rental.reservationId || ""),
      number: String(rental.number || ""),
      endsAt: rental.endsAt || null,
      serviceName,
      duration,
      durationLabel: String(rental.durationLabel || duration),
      totalNgn: retailTotal,
    },
  });
}
