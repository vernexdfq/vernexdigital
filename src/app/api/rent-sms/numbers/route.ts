import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/**
 * GET /api/rent-sms/numbers          → the signed-in customer's rentals (panel DB)
 * GET /api/rent-sms/numbers?res=<id> → live SMS inbox for one rental (via Verxor)
 */
export async function GET(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json({ ok: false, error: "Rent-for-SMS is not configured on this panel yet." }, { status: 503 });
  }
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to see your numbers." }, { status: 401 });
  const admin = createServerClient();

  const res = req.nextUrl.searchParams.get("res");
  if (res) {
    // Verify the reservation belongs to this customer before proxying the inbox.
    const { data: own } = await admin
      .from("rent_sms_orders")
      .select("id")
      .eq("user_id", user.id)
      .eq("reservation_id", res)
      .limit(1);
    if (!own || own.length === 0) {
      return NextResponse.json({ ok: false, error: "That rental was not found on your account." }, { status: 404 });
    }
    try {
      const upstream = await verxorFetch(`/rent-sms/numbers?res=${encodeURIComponent(res)}`, { method: "GET" });
      const data = (await upstream.json().catch(() => ({}))) as {
        ok?: boolean;
        messages?: Array<{ id?: string; from?: string; text?: string; receivedAt?: string }>;
        error?: string;
      };
      if (upstream.ok && data.ok && Array.isArray(data.messages)) {
        return NextResponse.json({ ok: true, messages: data.messages });
      }
      return NextResponse.json({ ok: false, error: data.error || "Could not load messages right now." }, { status: 502 });
    } catch {
      return NextResponse.json({ ok: false, error: "Could not load messages right now." }, { status: 502 });
    }
  }

  const { data: rows, error } = await admin
    .from("rent_sms_orders")
    .select("id, service_name, duration, area_code, phone_number, reservation_id, charged_ngn, status, ends_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    return NextResponse.json({ ok: false, error: "Your rentals list is not available yet. Contact support." }, { status: 503 });
  }
  const rentals = (rows || []).map((r) => ({
    id: String(r.id),
    reservationId: String(r.reservation_id || ""),
    serviceName: String(r.service_name || ""),
    duration: String(r.duration || ""),
    number: String(r.phone_number || ""),
    chargedNgn: Number(r.charged_ngn) || 0,
    status: String(r.status || ""),
    endsAt: r.ends_at ? String(r.ends_at) : null,
    createdAt: String(r.created_at || ""),
  }));
  return NextResponse.json({ ok: true, rentals });
}
