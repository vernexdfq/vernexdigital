import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

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
 * List the authenticated user's boost orders from Supabase transactions table,
 * filtered by kind="boost", with order metadata and live tracking status.
 */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  try {
    const admin = createServerClient();
    const { data, error } = await admin
      .from("transactions")
      .select("id, title, amount, status, meta, created_at")
      .eq("user_id", user.id)
      .eq("kind", "boost")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const orders = (data || []).map((t) => {
      const meta = (t.meta as Record<string, unknown>) || {};
      const amount = Math.abs(Number(t.amount) || 0);
      const rawStatus = String(t.status || "processing").toLowerCase();
      // Map transactions status: completed -> in_progress/completed, pending -> pending
      let displayStatus = "pending";
      if (rawStatus === "completed" || rawStatus === "success") {
        displayStatus = meta.providerStatus ? String(meta.providerStatus).toLowerCase() : "in_progress";
      } else if (rawStatus === "failed" || rawStatus === "refunded") {
        displayStatus = "failed";
      }

      return {
        id: String(meta.providerOrderId || meta.ref || t.id),
        txnId: t.id,
        ref: String(meta.ref || ""),
        service: String(meta.serviceTitle || t.title.replace(/^Boost\s*[-—:]?\s*/i, "")),
        platform: String(meta.platform || ""),
        platformName: String(meta.platformName || ""),
        link: String(meta.link || ""),
        qty: Number(meta.quantity) || 0,
        total: amount,
        ratePer1000: Number(meta.ratePer1000) || 0,
        status: displayStatus,
        rawStatus: t.status,
        speed: String(meta.speed || ""),
        createdAt: t.created_at,
      };
    });

    return NextResponse.json({ ok: true, orders, count: orders.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load boost orders";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
