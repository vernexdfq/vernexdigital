import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";
import {
  BOOST_DEFAULT_MARKUPS,
  BOOST_TIERS,
  BOOST_TIER_META,
  type BoostTier,
} from "@/lib/boost-pricing";
import { getSharedBoostPricing } from "@/lib/boost-pricing-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/boost/pricing — tier multipliers the panel charges its customers.
 * PUT /api/boost/pricing — admin-only, saves per-tier multipliers.
 *
 * The panel sees only Verxor Naira prices and its own multipliers.
 * Verxor wholesale/partner figures are never exposed here.
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
  const { data: profile } = await db.from("profiles").select("is_admin").eq("id", data.user.id).maybeSingle();
  return Boolean(profile?.is_admin);
}

export async function GET() {
  const { markups, persisted } = await getSharedBoostPricing();
  return NextResponse.json({
    ok: true,
    persisted,
    markups,
    defaultMarkups: BOOST_DEFAULT_MARKUPS,
    tiers: BOOST_TIERS.map((t: BoostTier) => ({
      id: t,
      label: BOOST_TIER_META[t].label,
      blurb: BOOST_TIER_META[t].blurb,
      sampleNgn: BOOST_TIER_META[t].sampleNgn,
    })),
    note: "Boost service prices come from Verxor in Naira. Customers pay the Verxor price × your tier multiplier.",
  });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const incoming = body.markups && typeof body.markups === "object" ? body.markups : null;
  if (!incoming) {
    return NextResponse.json({ ok: false, error: "Multipliers are required" }, { status: 400 });
  }

  const markups: Record<BoostTier, number> = { ...BOOST_DEFAULT_MARKUPS };
  for (const tier of BOOST_TIERS) {
    const m = Number(incoming[tier]);
    if (!Number.isFinite(m) || m < 1 || m > 10) {
      return NextResponse.json(
        { ok: false, error: `${BOOST_TIER_META[tier].label} multiplier must be between 1.0 and 10.0` },
        { status: 400 },
      );
    }
    markups[tier] = m;
  }

  try {
    const db = createServerClient();
    const { error } = await db
      .from("site_settings")
      .update({ boost_pricing: { markups }, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      return NextResponse.json(
        { ok: false, error: "Could not save multipliers. Apply the boost_pricing migration first." },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, markups });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not save multipliers" },
      { status: 500 },
    );
  }
}
