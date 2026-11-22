import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { logsWholesaleNgn, logsRetailNgnFor } from "@/lib/logs-pricing";
import { getSharedLogsPricing } from "@/lib/logs-pricing-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function getUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anon || !token) return null;
  const auth = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } });
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
 * POST /api/logs/buy
 * Verifies the listing against the parent catalogue server-side, debits the
 * customer's panel wallet at panel retail pricing, buys wholesale from Verxor
 * with the panel API key (the parent debits our reseller wallet), refunds on
 * failure and short delivery, then delivers credentials and saves to logs_orders.
 */
export async function POST(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json({ ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." }, { status: 503 });
  }
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to buy accounts." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const platform = String(body.platform || "").trim();
  const adId = Number(body.providerListingId);
  const qty = Number(body.quantity);
  if (!platform || !Number.isSafeInteger(adId) || adId <= 0) {
    return NextResponse.json({ ok: false, error: "Select a listing to continue." }, { status: 400 });
  }
  if (!Number.isSafeInteger(qty) || qty < 1 || qty > 10) {
    return NextResponse.json({ ok: false, error: "Quantity must be between 1 and 10." }, { status: 400 });
  }

  // Verify the listing, stock and parent price server-side. Client prices are never trusted.
  let offer: Record<string, unknown> | null = null;
  try {
    const qs = new URLSearchParams({ platform, refresh: "1" });
    const catalogRes = await verxorFetch(`/accounts/catalog?${qs.toString()}`, { method: "GET" });
    const catalog = await catalogRes.json().catch(() => ({}));
    const opts: Record<string, unknown>[] = Array.isArray(catalog.offers) ? catalog.offers : [];
    offer = opts.find((o) => Number(o.providerListingId) === adId) ?? null;
    if (!catalogRes.ok || !catalog.ok || !offer || Number(offer.stock) < qty) {
      return NextResponse.json(
        { ok: false, error: "This listing is no longer available in the requested quantity. Refresh and try again." },
        { status: 409 },
      );
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Could not verify this listing with Verxor. Please try again." }, { status: 502 });
  }

  const parentUnitNgn = Math.round(Number(offer.priceNgn) || 0);
  if (parentUnitNgn <= 0) {
    return NextResponse.json({ ok: false, error: "This listing's price could not be confirmed. Refresh and try again." }, { status: 409 });
  }
  const wholesaleUnit = logsWholesaleNgn(parentUnitNgn);
  const retailUnit = logsRetailNgnFor(wholesaleUnit, (await getSharedLogsPricing()).retail);
  const retailTotal = retailUnit * qty;

  const admin = createServerClient();
  const ref = `logs_${crypto.randomUUID()}`;

  // Best-effort ledger trail for reconciliation.
  async function writeLedger(status: string, extra: Record<string, unknown> = {}) {
    try {
      await admin.from("transactions").insert({
        user_id: user.id,
        kind: "buy_logs",
        status,
        amount: -retailTotal,
        title: `Buy logs — ${platform}${status === "success" ? "" : ` (${status})`}`,
        meta: { ref, platform, providerListingId: adId, quantity: qty, retailUnit, wholesaleUnit, ...extra },
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
  const customerName = typeof meta.full_name === "string" && meta.full_name.trim() ? meta.full_name.trim() : (user.email || "");

  let upstream: Response;
  let data: Record<string, any>;
  try {
    upstream = await verxorFetch("/accounts/buy", {
      method: "POST",
      body: JSON.stringify({
        platform,
        providerListingId: adId,
        quantity: qty,
        customerName,
        customerEmail: user.email || "",
        customerPaidNgn: retailTotal,
      }),
    });
    data = await upstream.json().catch(() => ({}));
  } catch {
    // A timed-out request may already have been purchased upstream. Never blind-refund.
    await writeLedger("pending", { stage: "upstream_timeout" });
    return NextResponse.json(
      { ok: false, pending: true, reference: ref, error: `The provider response timed out. Your wallet remains reserved while this is reconciled. Do not retry yet; contact support with reference ${ref}.` },
      { status: 202 },
    );
  }

  if (!upstream.ok || !data.ok) {
    if (data.code === "provider_timeout_unconfirmed") {
      await writeLedger("pending", { stage: "provider_timeout_unconfirmed", upstreamReference: String(data.reference || "") });
      return NextResponse.json(
        { ok: false, pending: true, reference: ref, error: "The purchase is still being confirmed with the provider. Your wallet was debited and any overcharge will be refunded automatically once confirmed. Keep reference " + ref + "." },
        { status: 202 },
      );
    }
    const refund = await changeWalletBalance(admin, user.id, (b) => b + retailTotal);
    if (!refund.ok) {
      await writeLedger("pending", { stage: "refund_reconciliation", reason: String(data.error || "") });
      return NextResponse.json(
        { ok: false, pending: true, reference: ref, error: "The purchase failed upstream and the refund needs reconciliation. Contact support with reference " + ref },
        { status: 202 },
      );
    }
    // Refund trail row — separate kind so earnings never counts it as a sale.
    try {
      await admin.from("transactions").insert({
        user_id: user.id,
        kind: "logs_refund",
        status: "success",
        amount: retailTotal,
        title: "Refund — Buy logs",
        meta: { ref, reason: String(data.error || "") },
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json({ ok: false, error: data.error || "Purchase failed at provider. Your wallet has been refunded." }, { status: 502 });
  }

  const credentials = Array.isArray(data.credentials) ? data.credentials.map((c: unknown) => String(c)) : [];
  const deliveredQty = Number(data.quantity) || credentials.length || qty;
  const shortQty = Math.max(0, qty - deliveredQty);
  let chargedTotal = retailTotal;
  if (shortQty > 0) {
    const refundShort = await changeWalletBalance(admin, user.id, (b) => b + retailUnit * shortQty);
    if (refundShort.ok) chargedTotal = retailTotal - retailUnit * shortQty;
  }
  const wholesaleTotal = Number(data.wholesale?.totalNgn) || wholesaleUnit * deliveredQty;
  const title = String(data.title || offer.title || "Accounts");
  const platformName = String(data.platform || platform);

  const insert = await admin.from("logs_orders").insert({
    user_id: user.id,
    platform: platformName,
    title,
    quantity: deliveredQty,
    unit_price_ngn: retailUnit,
    total_ngn: chargedTotal,
    wholesale_total_ngn: wholesaleTotal,
    credentials,
    status: "delivered",
    provider_order_id: data.orderId ? String(data.orderId) : null,
    client_reference: ref,
  }).select("id").maybeSingle();

  await writeLedger("success", { deliveredQty, chargedTotal, wholesaleTotal, panelCharge: wholesaleTotal, providerOrderId: data.orderId ? String(data.orderId) : null });

  return NextResponse.json({
    ok: true,
    warning: insert.error ? "Purchase accepted, but order history could not be saved. Save your credentials and contact support." : undefined,
    order: {
      id: insert.data?.id ? String(insert.data.id) : ref,
      title,
      platform: platformName,
      quantity: deliveredQty,
      unitPriceNgn: retailUnit,
      totalNgn: chargedTotal,
      credentials,
    },
  });
}
