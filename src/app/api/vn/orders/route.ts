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

/** List current user's virtual number orders from vn_orders. */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  try {
    const admin = createServerClient();
    const { data, error } = await admin
      .from("vn_orders")
      .select(
        "id, provider, provider_order_id, phone, service, country, pool_id, price_ngn, status, otp_code, refunded, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const orders = (data || []).map((o) => ({
      id: o.id,
      provider: o.provider || "grizzly",
      providerSlug: o.provider || "grizzly",
      providerOrderId: o.provider_order_id,
      phone: o.phone,
      service: o.service,
      country: o.country,
      poolId: o.pool_id,
      priceNgn: Number(o.price_ngn) || 0,
      status: o.status,
      code: o.otp_code || undefined,
      refunded: Boolean(o.refunded),
      createdAt: o.created_at,
    }));

    return NextResponse.json({ ok: true, orders, count: orders.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load orders";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
