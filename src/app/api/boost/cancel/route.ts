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

function isJapId(id: unknown): boolean {
  return /^\d{6,}$/.test(String(id || "").trim());
}

/**
 * POST /api/boost/cancel
 * Cancels a boost order at the provider (via Verxor /boost/cancel) and refunds
 * the END USER's panel wallet for the undelivered part only — exactly what the
 * provider refunds. The provider keeps the money for the part that was already
 * delivered (remains = undelivered quantity, refund = price × remains ÷ qty).
 *
 * Verxor reconciles the panel's wholesale/master balance separately using the
 * order's debit reference.
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
  const txnId = String(body.txnId || "").trim();
  if (!txnId) {
    return NextResponse.json({ ok: false, error: "orderId is required" }, { status: 400 });
  }

  const admin = createServerClient();

  // 1) Find the order among THIS user's boost transactions (ownership enforced).
  const { data: txn, error: txnError } = await admin
    .from("transactions")
    .select("id,title,amount,status,meta,created_at,kind")
    .eq("id", txnId)
    .eq("user_id", user.id)
    .in("kind", ["boost", "boost_order"])
    .maybeSingle();
  if (txnError || !txn) {
    return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  }

  const meta = (txn.meta as Record<string, unknown>) || {};
  const rawStatus = String(txn.status || "").toLowerCase();
  if (rawStatus === "success") {
    return NextResponse.json(
      { ok: false, error: "This order is completed and cannot be cancelled." },
      { status: 409 },
    );
  }
  if (rawStatus === "rejected") {
    const prov = String(meta.providerStatus || "").toLowerCase();
    if (prov.includes("cancel")) {
      return NextResponse.json(
        { ok: true, cancelled: true, alreadyCancelled: true },
      );
    }
    return NextResponse.json(
      { ok: false, error: "This order was already closed and refunded. Contact support." },
      { status: 409 },
    );
  }

  const ref = String(meta.ref || "").trim();
  const priceNgn = Math.abs(Number(txn.amount) || 0);
  const quantity = Number(meta.quantity) || 0;
  if (priceNgn <= 0 || quantity <= 0) {
    return NextResponse.json(
      { ok: false, error: "Order details are incomplete; contact support before cancelling." },
      { status: 409 },
    );
  }

  // 2) Claim the cancellation so a double-tap can't double-refund.
  const claimedMeta = { ...meta, cancelRequestedAt: new Date().toISOString() };
  const { data: claimed } = await admin
    .from("transactions")
    .update({ meta: claimedMeta })
    .eq("id", txn.id)
    .eq("user_id", user.id)
    .filter("meta->>cancelRequestedAt", "is", "null")
    .select("id")
    .maybeSingle();
  if (!claimed) {
    return NextResponse.json(
      { ok: false, error: "A cancel is already in progress for this order. Refresh in a moment." },
      { status: 409 },
    );
  }

  // 3) Resolve the numeric provider (JAP) order id — required by the provider.
  let japId = "";
  for (const c of [meta.providerOrderId, meta.orderId, meta.japOrderId]) {
    if (isJapId(c)) {
      japId = String(c).trim();
      break;
    }
  }
  if (!japId && ref) {
    // Reconcile through Verxor: it maps the boost-… reference to the provider id.
    try {
      const stRes = await verxorFetch(`/boost/status?orderId=${encodeURIComponent(ref)}`);
      const stData = await stRes.json().catch(() => ({}));
      const resolved = String(stData?.orderId || stData?.providerOrderId || "").trim();
      if (stRes.ok && stData?.ok !== false && isJapId(resolved)) japId = resolved;
    } catch {
      /* resolution attempt failed — touched on below */
    }
  }
  if (!japId) {
    await admin.from("transactions").update({ meta: { ...meta } }).eq("id", txn.id);
    return NextResponse.json(
      {
        ok: false,
        error:
          "The provider order id hasn't resolved yet. Tap Refresh Status once, then try cancelling again.",
      },
      { status: 409 },
    );
  }

  try {
    // 4) Cancel at the provider via Verxor. debitRef makes Verxor refund the
    // panel's master wallet by the EXACT wholesale charge recorded in its ledger.
    const res = await verxorFetch("/boost/cancel", {
      method: "POST",
      body: JSON.stringify({
        orderId: japId,
        amount: priceNgn,
        quantity,
        debitRef: ref || undefined,
        walletMode: "reseller_wallet",
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || data.ok === false || data.cancelled !== true) {
      const errMsg =
        String(data.error || "").trim() ||
        "The provider did not accept a cancel for this order (it may already be far along).";
      // Release the claim so the user can retry after the provider changes state.
      await admin.from("transactions").update({ meta: { ...meta } }).eq("id", txn.id);
      return NextResponse.json({ ok: false, error: errMsg }, { status: 502 });
    }

    // 5) Provider-exact refund to the END USER: refund only the undelivered part.
    const remains = data.remains != null && Number.isFinite(Number(data.remains)) ? Number(data.remains) : null;
    let userRefund = priceNgn;
    if (remains != null) {
      const undelivered = Math.min(Math.max(remains, 0), quantity);
      userRefund = Math.round(priceNgn * (undelivered / quantity) * 100) / 100;
    }

    let refunded = false;
    if (userRefund > 0) {
      const refundKey = `boost-cancel:${txn.id}`;
      const refund = await admin.rpc("vn_wallet_refund", {
        p_user_id: user.id,
        p_amount: userRefund,
        p_refund_key: refundKey,
        p_title: "Boost order cancelled — refund",
        p_meta: {
          txnId: txn.id,
          orderId: japId,
          ref,
          remains: remains != null ? remains : undefined,
          quantity,
          priceNgn,
          reason: "user_cancel",
        },
      });
      refunded = !refund.error && Boolean((refund.data as { ok?: boolean } | null)?.ok);
    }

    // 6) Persist final state on the transaction (cancelled + refund facts).
    const finalMeta: Record<string, unknown> = {
      ...meta,
      providerOrderId: japId,
      orderId: japId,
      japOrderId: japId,
      providerStatus: "cancelled",
      japStatus: String(data.japStatus || "canceled"),
      remains: remains != null ? remains : meta.remains,
      refundAmount: refunded ? userRefund : 0,
      cancelled: true,
      cancelledAt: new Date().toISOString(),
    };
    await admin
      .from("transactions")
      .update({ status: "rejected", meta: finalMeta })
      .eq("id", txn.id)
      .eq("user_id", user.id);

    const fmt = (n: number) =>
      n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return NextResponse.json({
      ok: true,
      cancelled: true,
      refunded,
      refundAmount: refunded ? userRefund : 0,
      remains: remains != null ? remains : undefined,
      message: refunded
        ? remains != null && userRefund < priceNgn
          ? `Cancelled — delivered part kept by the provider, ₦${fmt(userRefund)} refunded to your wallet`
          : `Cancelled and ₦${fmt(userRefund)} refunded to your wallet`
        : "Cancelled. Your refund needs a moment to settle — contact support if it doesn't appear.",
    });
  } catch (e) {
    // Outcome unknown; keep the claim so we never double-refund. Reconcile manually.
    const msg = e instanceof Error ? e.message : "Cancel outcome unknown";
    return NextResponse.json(
      {
        ok: false,
        error: `Cancellation outcome is being verified. Do not retry yet — contact support. (${msg})`,
      },
      { status: 202 },
    );
  }
}
