import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/**
 * Cancel waiting VN on Verxor, refund end-user wallet AND partner reseller_wallet,
 * mark vn_orders cancelled/refunded.
 *
 * - priceNgn (retail) → credited back to the end-user on this panel
 * - wholesaleNgn → sent to Verxor so the panel wholesale balance is restored
 */
export async function POST(req: NextRequest) {
  const { configured } = verxorConfig();
  if (!configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured" },
      { status: 503 },
    );
  }

  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const providerOrderId = String(body.providerOrderId || "").trim();
  const orderId = String(body.orderId || "").trim();
  const provider = String(body.provider || "grizzly").trim().toLowerCase();
  if (!providerOrderId) return NextResponse.json({ ok: false, error: "providerOrderId required" }, { status: 400 });

  const admin = createServerClient();
  const lookup = admin.from("vn_orders").select("id, provider_order_id, price_ngn, wholesale_ngn, status, refunded")
    .eq("user_id", user.id).eq("provider_order_id", providerOrderId);
  const { data: order, error: lookupError } = orderId ? await lookup.eq("id", orderId).maybeSingle() : await lookup.maybeSingle();
  if (lookupError || !order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  if (order.refunded || order.status === "refunded") return NextResponse.json({ ok: true, cancelled: true, refunded: true, alreadyRefunded: true });
  if (["cancelled", "expired", "received"].includes(String(order.status))) return NextResponse.json({ ok: false, error: `This order is already ${order.status}.` }, { status: 409 });
  const priceNgn = Math.round(Number(order.price_ngn) || 0);
  const wholesaleNgn = Math.round(Number(order.wholesale_ngn) || 0);
  if (priceNgn <= 0 || wholesaleNgn <= 0) return NextResponse.json({ ok: false, error: "Order pricing is missing; contact support before cancelling." }, { status: 409 });

  // Claim cancellation atomically to prevent double provider calls/refunds.
  const { data: claimed, error: claimError } = await admin.from("vn_orders").update({ status: "cancelling", updated_at: new Date().toISOString() })
    .eq("id", order.id).eq("user_id", user.id).eq("status", "waiting").select("id").maybeSingle();
  if (claimError || !claimed) return NextResponse.json({ ok: false, error: "This order is already being updated. Refresh the order list." }, { status: 409 });

  try {
    const res = await verxorFetch("/numbers/cancel", {
      method: "POST",
      body: JSON.stringify({ providerOrderId, orderId: order.id, priceNgn: wholesaleNgn, provider }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.earlyDenied) {
      await admin.from("vn_orders").update({ status: "waiting", updated_at: new Date().toISOString() }).eq("id", order.id).eq("user_id", user.id);
      return NextResponse.json({ ok: false, cancelled: false, earlyDenied: true, error: data.error || "Cancel not available yet. Wait a moment and try again." });
    }
    if (!res.ok || !data.ok || !data.cancelled || data.providerOk === false) {
      await admin.from("vn_orders").update({ status: "waiting", updated_at: new Date().toISOString() }).eq("id", order.id).eq("user_id", user.id);
      return NextResponse.json({ ok: false, error: data.error || "Cancel failed at provider" }, { status: 502 });
    }
    if (!data.refunded) {
      await admin.from("vn_orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id).eq("user_id", user.id);
      return NextResponse.json({ ok: false, cancelled: true, refunded: false, error: "Number cancelled, but the panel refund is still being reconciled. Contact support before retrying." }, { status: 202 });
    }

    const refundKey = `vn-cancel:${providerOrderId}`;
    const refund = await admin.rpc("vn_wallet_refund", {
      p_user_id: user.id, p_amount: priceNgn, p_refund_key: refundKey,
      p_title: "Virtual number cancelled — refund",
      p_meta: { providerOrderId, orderId: order.id, wholesaleNgn, panelRefunded: true, reason: "user_cancel" },
    });
    const refundOk = !refund.error && Boolean((refund.data as { ok?: boolean } | null)?.ok);
    if (!refundOk) {
      await admin.from("vn_orders").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", order.id).eq("user_id", user.id);
      return NextResponse.json({ ok: false, cancelled: true, refunded: false, error: "Number cancelled and panel balance restored, but your wallet refund needs reconciliation. Contact support." }, { status: 202 });
    }
    const { error: orderUpdateError } = await admin.from("vn_orders").update({ status: "refunded", refunded: true, updated_at: new Date().toISOString() }).eq("id", order.id).eq("user_id", user.id);
    if (orderUpdateError) console.error("VN cancellation order update failed after refund", { orderId: order.id, error: orderUpdateError.message });
    return NextResponse.json({ ok: true, cancelled: true, refunded: true, priceNgn, wholesaleNgn });
  } catch (e) {
    // Provider outcome may be unknown after a network error; keep the order locked for reconciliation.
    await admin.from("vn_orders").update({ status: "cancel_refund_pending", updated_at: new Date().toISOString() }).eq("id", order.id).eq("user_id", user.id);
    const message = e instanceof Error ? e.message : "Cancel outcome unknown";
    return NextResponse.json({ ok: false, pending: true, error: `Cancellation outcome needs reconciliation. Contact support before retrying. ${message}` }, { status: 202 });
  }
}
