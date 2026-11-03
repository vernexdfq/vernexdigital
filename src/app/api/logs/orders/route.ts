import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

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

/** GET /api/logs/orders — the signed-in customer's Buy Logs order history with credentials. */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to view your order history." }, { status: 401 });
  const admin = createServerClient();
  const { data, error } = await admin
    .from("logs_orders")
    .select("id, platform, title, quantity, unit_price_ngn, total_ngn, credentials, status, provider_order_id, client_reference, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ ok: false, error: "Order history is not initialized. Contact support before purchasing." }, { status: 503 });
  }
  const rows = (data || []) as Array<Record<string, unknown>>;
  const orders = rows.map((o) => ({
    id: String(o.id ?? ""),
    platform: String(o.platform ?? ""),
    title: String(o.title ?? "Accounts"),
    quantity: Number(o.quantity) || 0,
    unitPriceNgn: Number(o.unit_price_ngn) || 0,
    totalNgn: Number(o.total_ngn) || 0,
    credentials: Array.isArray(o.credentials) ? o.credentials.map((c) => String(c)) : [],
    status: String(o.status ?? "delivered"),
    reference: String(o.client_reference ?? ""),
    createdAt: o.created_at ? String(o.created_at) : null,
  }));
  return NextResponse.json({ ok: true, orders });
}
