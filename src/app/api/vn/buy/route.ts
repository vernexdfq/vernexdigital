import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { UI_POOL_TO_VERXOR, SERVICE_NAME_TO_CODE, panelWholesaleNgn } from "@/lib/verxor-pricing";
import { getSharedVnPricingState } from "@/lib/vn-pricing-server";
import { vnCustomerPrice } from "@/lib/vn-panel-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anon || !token) return null;
  const auth = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await auth.auth.getUser();
  return data.user || null;
}

export async function POST(req: NextRequest) {
  if (!verxorConfig().configured) return NextResponse.json({ ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." }, { status: 503 });
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to buy a number." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const serviceRaw = String(body.service || "").trim();
  const country = String(body.country || "").trim();
  const uiPool = String(body.pool || body.poolId || "").trim();
  const costUsd = Math.round(Number(body.costUsd) * 100) / 100;
  const service = SERVICE_NAME_TO_CODE[serviceRaw] || serviceRaw.toLowerCase();
  const pool = UI_POOL_TO_VERXOR[uiPool];
  if (!service || !country || !pool || !Number.isFinite(costUsd) || costUsd <= 0) {
    return NextResponse.json({ ok: false, error: "Select a current service, country, and available route." }, { status: 400 });
  }

  // Verify the chosen cost against the current parent catalog. Client retail and wholesale amounts are never trusted.
  try {
    const qs = new URLSearchParams({ mode: "prices", pool: pool.verxorPool, service, country });
    const catalogRes = await verxorFetch(`/catalog?${qs.toString()}`, { method: "GET" });
    const catalog = await catalogRes.json().catch(() => ({}));
    const option = Array.isArray(catalog.options) ? catalog.options.find((o: Record<string, unknown>) =>
      Math.round(Number(o.priceUsd) * 100) / 100 === costUsd && String(o.grizzlyCountry || "") === country && Number(o.stock) > 0
    ) : null;
    if (!catalogRes.ok || !catalog.ok || !option) {
      return NextResponse.json({ ok: false, error: "That route is no longer available. Refresh prices and try again." }, { status: 409 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Could not verify the route with Verxor. Please try again." }, { status: 502 });
  }

  const admin = createServerClient();
  const pricingState = await getSharedVnPricingState();
  if (!pricingState.ready) return NextResponse.json({ ok: false, error: "Virtual-number pricing is not initialized. Please contact support." }, { status: 503 });
  const { data: historyCheck, error: historyError } = await admin.from("vn_orders").select("id").limit(1);
  void historyCheck;
  if (historyError) return NextResponse.json({ ok: false, error: "Virtual-number order history is not initialized. Contact support before purchasing." }, { status: 503 });
  const wholesaleNgn = panelWholesaleNgn({ costUsd, tier: pool.tier });
  const priceNgn = vnCustomerPrice(wholesaleNgn, pricingState.config);
  if (priceNgn < 50 || wholesaleNgn <= 0) return NextResponse.json({ ok: false, error: "Invalid route price." }, { status: 409 });
  const ref = `vn_${crypto.randomUUID()}`;
  const debit = await admin.rpc("vn_wallet_debit", {
    p_user_id: user.id,
    p_amount: priceNgn,
    p_title: `Virtual number · ${serviceRaw || service}`,
    p_meta: { service, country, pool: uiPool, wholesaleNgn, ref },
  });
  if (debit.error) return NextResponse.json({ ok: false, error: "Wallet debit failed safely. Please retry." }, { status: 503 });
  const debitResult = debit.data as { ok?: boolean; reason?: string };
  if (!debitResult?.ok) return NextResponse.json({ ok: false, error: debitResult.reason === "insufficient_balance" ? "Insufficient wallet balance. Fund your wallet first." : "Wallet debit failed." }, { status: debitResult.reason === "insufficient_balance" ? 402 : 409 });

  let upstream: Response;
  let data: Record<string, any>;
  try {
    upstream = await verxorFetch("/numbers/buy", {
      method: "POST",
      body: JSON.stringify({ service, country, maxPriceUsd: costUsd, poolId: pool.verxorPool, priceNgn: wholesaleNgn }),
    });
    data = await upstream.json().catch(() => ({}));
  } catch {
    // A timed-out request may already have created a number upstream. Do not issue a blind refund that could make it free.
    return NextResponse.json({ ok: false, pending: true, reference: ref, error: `The provider response timed out. Your wallet remains reserved while this is reconciled. Do not retry yet; contact support with reference ${ref}.` }, { status: 202 });
  }

  if (!upstream.ok || !data.ok) {
    const refund = await admin.rpc("vn_wallet_refund", {
      p_user_id: user.id, p_amount: priceNgn, p_refund_key: `buy-failed:${ref}`,
      p_title: "Virtual number purchase refund", p_meta: { ref, reason: String(data.error || "provider rejected purchase") },
    });
    if (refund.error || !(refund.data as { ok?: boolean } | null)?.ok) {
      return NextResponse.json({ ok: false, pending: true, error: "The purchase failed upstream and the refund needs reconciliation. Contact support with this reference: " + ref }, { status: 202 });
    }
    return NextResponse.json({ ok: false, error: data.error || "Purchase failed at provider. Your wallet has been refunded." }, { status: 502 });
  }

  const order = data.order || {};
  const providerOrderId = String(order.providerOrderId || order.id || "");
  if (!providerOrderId) {
    return NextResponse.json({ ok: false, pending: true, error: "The provider accepted the request but did not return an order reference. Check Recent Orders before retrying." }, { status: 202 });
  }
  const phone = String(order.phone || "");
  const orderInsert = await admin.from("vn_orders").insert({
    user_id: user.id, provider: "grizzly", provider_order_id: providerOrderId, phone,
    service: serviceRaw || service, country: order.country || country, pool_id: uiPool,
    price_ngn: priceNgn, wholesale_ngn: wholesaleNgn, status: "waiting", refunded: false,
  }).select("id").maybeSingle();
  let savedId = orderInsert.data?.id ? String(orderInsert.data.id) : providerOrderId;
  if (orderInsert.error) {
    const { data: existing } = await admin.from("vn_orders").select("id").eq("provider", "grizzly").eq("provider_order_id", providerOrderId).eq("user_id", user.id).maybeSingle();
    if (existing?.id) savedId = String(existing.id);
  }

  // Keep a durable ledger reference even if the order migration is temporarily unavailable.
  const tx = await admin.from("transactions").update({ status: "completed", meta: { service, country, pool: uiPool, wholesaleNgn, providerOrderId, phone, ref } })
    .eq("user_id", user.id).eq("kind", "virtual_number").contains("meta", { ref });
  if (tx.error) console.error("VN transaction completion write failed", { ref, providerOrderId, error: tx.error.message });
  if (orderInsert.error && savedId === providerOrderId) console.error("VN order persistence failed", { ref, providerOrderId, error: orderInsert.error.message });

  return NextResponse.json({ ok: true, warning: orderInsert.error && savedId === providerOrderId ? "Purchase accepted, but order history could not be saved. Contact support with the provider reference." : undefined, order: {
    id: savedId, providerOrderId, phone, service: order.service || service, country: order.country || country,
    poolId: uiPool, priceNgn, wholesaleNgn, status: "waiting", provider: "grizzly",
  } });
}
