import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/partner-history
 * Panel wholesale-wallet funding history from Verxor:
 *   - self-funding deposits (OPay virtual account top-ups)
 *   - Verxor admin manual credit / debit actions
 */

async function isAdmin(req: NextRequest) {
  const partner = req.cookies.get(PARTNER_ADMIN_COOKIE)?.value;
  if (partner && verifyPartnerAdminToken(partner).ok) return true;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return false;
  const auth = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await auth.auth.getUser();
  if (!data.user) return false;
  const db = createServerClient();
  const { data: profile } = await db
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();
  return Boolean(profile?.is_admin);
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  const { configured } = verxorConfig();
  if (!configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY is not set on the panel server." },
      { status: 503 },
    );
  }

  try {
    const res = await verxorFetch("/partner/transactions");
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        { ok: false, error: data.error || "Verxor did not return funding history." },
        { status: 502 },
      );
    }
    return NextResponse.json({
      ok: true,
      entries: Array.isArray(data.entries) ? data.entries : [],
    });
  } catch (e) {
    console.error("[partner-history]", e);
    return NextResponse.json(
      { ok: false, error: "Could not load funding history. Try again." },
      { status: 500 },
    );
  }
}
