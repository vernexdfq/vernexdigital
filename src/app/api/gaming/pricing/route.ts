import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";
import {
  GAMING_TIERS,
  GAMING_TIER_META,
  GAMING_DEFAULT_MARKUPS,
  type GamingTier,
} from "@/lib/gaming-panel-pricing";
import { getSharedGamingPricing } from "@/lib/gaming-panel-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/gaming/pricing — tier multipliers the panel charges its customers,
 * plus each tier's Verxor child-price band and a sample so the admin page can
 * preview what customers pay.
 * PUT /api/gaming/pricing — admin-only, saves per-tier multipliers to
 * site_settings.gaming_pricing (jsonb; requires the gaming_pricing migration).
 *
 * The panel sees only Verxor child Naira prices and its own multipliers.
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

/** Verxor child-price band (₦) per tier; sample used for the admin preview. */
const TIER_BANDS: Record<GamingTier, { minNgn: number | null; maxNgn: number | null; sampleNgn: number }> = {
  t1: { minNgn: null, maxNgn: 2000, sampleNgn: 500 },
  t2: { minNgn: 2001, maxNgn: 8000, sampleNgn: 5000 },
  t3: { minNgn: 8001, maxNgn: 40000, sampleNgn: 20000 },
  t4: { minNgn: 40001, maxNgn: null, sampleNgn: 50000 },
};

export async function GET() {
  const { markups, persisted } = await getSharedGamingPricing();

  const tiers = GAMING_TIERS.map((t: GamingTier) => ({
    id: t,
    label: GAMING_TIER_META[t].label,
    blurb: GAMING_TIER_META[t].bandNgn,
    band: {
      minNgn: TIER_BANDS[t].minNgn,
      maxNgn: TIER_BANDS[t].maxNgn,
      // Just above the boundary so the multiplier of THIS tier applies.
      sampleNgn: TIER_BANDS[t].sampleNgn,
    },
  }));

  return NextResponse.json({
    ok: true,
    persisted,
    markups,
    defaultMarkups: GAMING_DEFAULT_MARKUPS,
    tiers,
    note: "Bands are on the Verxor child Naira price. Customers pay the Verxor price × your tier multiplier (rounded up to ₦1).",
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

  const markups: Record<GamingTier, number> = { ...GAMING_DEFAULT_MARKUPS };
  for (const tier of GAMING_TIERS) {
    const m = Number(incoming[tier]);
    if (!Number.isFinite(m) || m < 1 || m > 10) {
      return NextResponse.json(
        { ok: false, error: `${GAMING_TIER_META[tier].label} multiplier must be between 1.0 and 10.0` },
        { status: 400 },
      );
    }
    markups[tier] = m;
  }

  try {
    const db = createServerClient();
    const { error } = await db
      .from("site_settings")
      .update({ gaming_pricing: { markups }, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      return NextResponse.json(
        { ok: false, error: "Could not save multipliers. Apply the gaming_pricing migration first." },
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
