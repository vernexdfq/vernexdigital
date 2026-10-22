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
  let priceNgn = Math.round(Number(body.priceNgn) || 0);
  let wholesaleNgn = Math.round(Number(body.wholesaleNgn) || 0);
  const provider = String(body.provider || "grizzly").trim().toLowerCase();

  if (!providerOrderId) {
    return NextResponse.json(
      { ok: false, error: "providerOrderId required" },
      { status: 400 },
    );
  }

  const admin = createServerClient();

  // Resolve retail + wholesale from durable order / transaction if client omitted them
  try {
    let orderRow: {
      price_ngn?: number;
      wholesale_ngn?: number;
      id?: string;
    } | null = null;

    if (orderId) {
      const { data } = await admin
        .from("vn_orders")
        .select("id, price_ngn, wholesale_ngn")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .maybeSingle();
      orderRow = data;
    }
    if (!orderRow && providerOrderId) {
      const { data } = await admin
        .from("vn_orders")
        .select("id, price_ngn, wholesale_ngn")
        .eq("provider_order_id", providerOrderId)
        .eq("user_id", user.id)
        .maybeSingle();
      orderRow = data;
    }

    if (orderRow) {
      if (priceNgn <= 0 && Number(orderRow.price_ngn) > 0) {
        priceNgn = Math.round(Number(orderRow.price_ngn));
      }
      if (wholesaleNgn <= 0 && Number(orderRow.wholesale_ngn) > 0) {
        wholesaleNgn = Math.round(Number(orderRow.wholesale_ngn));
      }
    }

    if (wholesaleNgn <= 0) {
      const { data: tx } = await admin
        .from("transactions")
        .select("meta, amount")
        .eq("user_id", user.id)
        .eq("kind", "virtual_number")
        .order("created_at", { ascending: false })
        .limit(20);
      const match = (tx || []).find((t: { meta?: { providerOrderId?: string; wholesaleNgn?: number } }) => {
        const m = t.meta || {};
        return (
          String(m.providerOrderId || "") === providerOrderId ||
          Number(m.wholesaleNgn) > 0
        );
      });
      if (match?.meta && Number((match.meta as { wholesaleNgn?: number }).wholesaleNgn) > 0) {
        wholesaleNgn = Math.round(Number((match.meta as { wholesaleNgn?: number }).wholesaleNgn));
      }
    }
  } catch {
    /* best-effort lookup */
  }

  // Fallback: if we only know retail, still tell Verxor something so panel is not stuck
  const panelRefundNgn = wholesaleNgn > 0 ? wholesaleNgn : priceNgn;

  try {
    const res = await verxorFetch("/numbers/cancel", {
      method: "POST",
      body: JSON.stringify({
        providerOrderId,
        orderId: orderId || undefined,
        // Wholesale amount → Verxor credits reseller_wallet (partner fund)
        priceNgn: panelRefundNgn,
        provider,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (data.earlyDenied) {
      return NextResponse.json({
        ok: false,
        cancelled: false,
        earlyDenied: true,
        error: data.error || "Cancel not available yet. Wait a moment and try again.",
      });
    }

    if (!res.ok && !data.ok && !data.cancelled) {
      return NextResponse.json(
        { ok: false, error: data.error || "Cancel failed at provider" },
        { status: 502 },
      );
    }

    // Refund end-user retail balance on this panel
    let refunded = false;
    if (priceNgn > 0) {
      const { data: wallet } = await admin
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      const bal = Number(wallet?.balance) || 0;
      const newBal = Math.round((bal + priceNgn) * 100) / 100;
      const { error: creditErr } = await admin
        .from("wallets")
        .update({ balance: newBal, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (!creditErr) {
        refunded = true;
        await admin.from("transactions").insert({
          user_id: user.id,
          kind: "virtual_number_refund",
          title: "Virtual number cancelled — refund",
          amount: priceNgn,
          status: "completed",
          meta: {
            providerOrderId,
            orderId: orderId || null,
            wholesaleNgn: panelRefundNgn,
            panelRefunded: Boolean(data.refunded),
            reason: "user_cancel",
          },
        });
      }
    }

    try {
      const patch = {
        status: refunded ? "refunded" : "cancelled",
        refunded,
        updated_at: new Date().toISOString(),
      };
      if (orderId) {
        await admin.from("vn_orders").update(patch).eq("id", orderId).eq("user_id", user.id);
      } else {
        await admin
          .from("vn_orders")
          .update(patch)
          .eq("provider_order_id", providerOrderId)
          .eq("user_id", user.id);
      }
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({
      ok: true,
      cancelled: true,
      refunded,
      panelRefunded: Boolean(data.refunded),
      priceNgn,
      wholesaleNgn: panelRefundNgn,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Cancel failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
