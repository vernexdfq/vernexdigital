import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/gaming/order-status  { ref }
 * Panel-customer auth (Supabase bearer token). Looks up the live delivery
 * status of a gaming top-up order the customer placed on this panel by
 * querying Verxor with the panel key. Verxor live-syncs with Shop2TopUp,
 * so this reflects true delivery state (processing -> completed).
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
    return NextResponse.json({ ok: false, error: "Sign in required." }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { ref?: string };
  const ref = String(body.ref || "").trim();
  if (!ref) {
    return NextResponse.json({ ok: false, error: "Missing order reference." }, { status: 400 });
  }
  try {
    const upstream = await verxorFetch(
      `/partner/gaming-orders?ref=${encodeURIComponent(ref)}`,
    );
    const data = (await upstream.json().catch(() => ({}))) as {
      ok?: boolean;
      orders?: Array<{ ref: string; status: string; message?: string }>;
    };
    if (!upstream.ok || !data.ok) {
      return NextResponse.json(
        { ok: false, error: "Could not check the order status right now. Try again shortly." },
        { status: 502 },
      );
    }
    const row = (data.orders || []).find((o) => o.ref === ref);
    if (!row) {
      return NextResponse.json(
        { ok: false, error: "Order not found. If you were charged, contact support with your reference." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      status: String(row.status || "processing"),
      message: row.message || undefined,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Network error checking the order. Try again." },
      { status: 502 },
    );
  }
}
