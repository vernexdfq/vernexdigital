import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { gamingCustomerPrice, getSharedGamingPricing } from "@/lib/gaming-panel-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/gaming/purchase
 * 1. Auth the panel customer (Supabase bearer token).
 * 2. Verify the denomination live against Verxor (customer amounts are never trusted).
 * 3. Debit the customer wallet at the panel customer price.
 * 4. Place the order upstream with the panel key (Verxor debits the panel wallet at
 *    the child-panel price and runs the provider order).
 * 5. Refund the customer if the upstream order fails.
 */

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

export async function POST(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." },
      { status: 503 },
    );
  }
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to complete your purchase." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    productId?: string;
    variationId?: string;
    quantity?: number;
    fields?: Record<string, string>;
  };
  const productId = String(body.productId || "").trim();
  const variationId = String(body.variationId || "").trim();
  const quantity = Math.max(1, Math.min(99, Math.floor(Number(body.quantity) || 1)));
  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(body.fields || {})) {
    const val = String(v || "").trim();
    if (val) fields[k] = val;
  }
  if (!productId || !variationId) {
    return NextResponse.json({ ok: false, error: "Missing product or denomination" }, { status: 400 });
  }

  // 1) Verify the denomination live, upstream price is the source of truth.
  let upstreamDetail: {
    name?: string;
    variations?: Array<{ id: string; name: string; priceNgn: number; inStock: boolean }>;
  } | null = null;
  try {
    const res = await verxorFetch(
      `/gaming/product?product_id=${encodeURIComponent(productId)}`,
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      product?: { name?: string; variations?: Array<{ id: string; name: string; priceNgn: number; inStock: boolean }> };
    };
    if (res.ok && data.ok && data.product) upstreamDetail = data.product;
  } catch {
    /* handled below */
  }
  const variation = upstreamDetail?.variations?.find((v) => v.id === variationId);
  if (!upstreamDetail || !variation) {
    return NextResponse.json(
      { ok: false, error: "That option is no longer available. Refresh and try again." },
      { status: 409 },
    );
  }
  if (variation.inStock === false) {
    return NextResponse.json(
      { ok: false, error: "That denomination just went out of stock. Pick another one." },
      { status: 409 },
    );
  }

  // 2) Panel customer price from the live Verxor child price.
  const { markups } = await getSharedGamingPricing();
  const unitNgn = gamingCustomerPrice(variation.priceNgn, markups);
  const totalNgn = unitNgn * quantity;
  if (!unitNgn || unitNgn <= 0) {
    return NextResponse.json({ ok: false, error: "Pricing is unavailable for that denomination." }, { status: 409 });
  }

  const productName = String(upstreamDetail.name || productId);
  const ref = `gmg_panel_${crypto.randomUUID()}`;

  // 3) Debit the panel customer wallet.
  const admin = createServerClient();
  const debit = await admin.rpc("vn_wallet_debit", {
    p_user_id: user.id,
    p_amount: totalNgn,
    p_title: `Gaming · ${productName} · ${variation.name}${quantity > 1 ? ` ×${quantity}` : ""}`,
    p_meta: { service: "gaming", productId, variationId, quantity, unitNgn, ref },
  });
  if (debit.error) {
    return NextResponse.json({ ok: false, error: "Wallet debit failed safely. Please retry." }, { status: 503 });
  }
  const debitResult = debit.data as { ok?: boolean; reason?: string } | null;
  if (!debitResult?.ok) {
    const insufficient = debitResult?.reason === "insufficient_balance";
    return NextResponse.json(
      {
        ok: false,
        error: insufficient
          ? `Insufficient wallet balance — total is ₦${totalNgn.toLocaleString("en-NG")}. Fund your wallet and try again.`
          : "Wallet debit failed. Please retry.",
      },
      { status: insufficient ? 402 : 409 },
    );
  }

  // 4) Place the order upstream (Verxor debits the panel wallet at child price).
  let data: Record<string, unknown> = {};
  let ok = false;
  try {
    const upstream = await verxorFetch("/gaming/purchase", {
      method: "POST",
      body: JSON.stringify({ productId, variationId, quantity, fields }),
    });
    data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;
    ok = upstream.ok && data.ok !== false;
  } catch {
    ok = false;
  }

  if (!ok) {
    // 5) Refund the customer — upstream never completed.
    await admin
      .rpc("vn_wallet_refund", {
        p_user_id: user.id,
        p_amount: totalNgn,
        p_refund_key: `gaming-failed:${ref}`,
        p_title: `Gaming refund · ${productName}`,
        p_meta: { ref, reason: "upstream_failed" },
      })
      .then(null, () => null);
    const upstreamError = String((data as { error?: string }).error || "");
    if (/insufficient panel|Panel wallet/i.test(upstreamError)) {
      return NextResponse.json(
        { ok: false, error: "Payment is temporarily unavailable. Our team has been notified — you have not been charged." },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { ok: false, refunded: true, error: upstreamError || "The purchase could not complete. Your wallet was refunded." },
      { status: 502 },
    );
  }

  const order = (data.order ?? {}) as Record<string, unknown>;
  return NextResponse.json({
    ok: true,
    order: {
      ref: String(order.ref ?? ref),
      status: String(order.status ?? "processing"),
      productName,
      variationName: variation.name,
      quantity,
      totalNgn,
    },
  });
}
