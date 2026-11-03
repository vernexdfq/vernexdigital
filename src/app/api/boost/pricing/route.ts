import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";
import { USD_NGN, partnerMult, BOOST_DEFAULT_MARKUP, boostMarkupFromEnv } from "@/lib/boost-pricing";
import { getSharedBoostPricing } from "@/lib/boost-pricing-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const { data: profile } = await db.from("profiles").select("is_admin").eq("id", data.user.id).maybeSingle();
  return Boolean(profile?.is_admin);
}

export async function GET() {
  const { markup, persisted } = await getSharedBoostPricing();
  return NextResponse.json({
    ok: true,
    persisted,
    markup,
    envMarkup: boostMarkupFromEnv(),
    defaultMarkup: BOOST_DEFAULT_MARKUP,
    usdNgn: USD_NGN,
    partnerMults: [
      { label: "Economy", band: "Under $0.50", mult: 2.0 },
      { label: "Standard", band: "$0.50 – $1.00", mult: 1.7 },
      { label: "Fast", band: "$1.01 – $2.00", mult: 1.35 },
      { label: "Premium", band: "Above $2.00", mult: 1.15 },
    ],
    note: "Verxor partner rate is locked. Customers pay partner rate × (1 + markup).",
  });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const markup = Number(body.markup);
  if (!Number.isFinite(markup) || markup < 0 || markup > 5) {
    return NextResponse.json(
      { ok: false, error: "Markup must be between 0% and 500%" },
      { status: 400 },
    );
  }
  try {
    const db = createServerClient();
    const { error } = await db
      .from("site_settings")
      .update({ boost_pricing: { markup }, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      return NextResponse.json(
        { ok: false, error: "Could not save markup. Apply the boost_pricing migration first." },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, markup });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not save markup" },
      { status: 500 },
    );
  }
}
