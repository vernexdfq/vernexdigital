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
 * Cancel waiting VN on Verxor, refund end-user wallet, mark vn_orders cancelled/refunded.
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
  const priceNgn = Math.round(Number(body.priceNgn) || 0);
  const provider = String(body.provider || "grizzly").trim().toLowerCase();

  if (!providerOrderId) {
    return NextResponse.json(
      { ok: false, error: "providerOrderId required" },
      { status: 400 },
    );
  }

  const admin = createServerClient();

  try {
    const res = await verxorFetch("/numbers/cancel", {
      method: "POST",
      body: JSON.stringify({
        providerOrderId,
        orderId: orderId || undefined,
        priceNgn: 0,
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
            reason: "user_cancel",
          },
        });
      }
    }

    // Update durable order row
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
      priceNgn,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Cancel failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
