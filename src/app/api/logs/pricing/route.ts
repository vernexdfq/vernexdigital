import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";
import {
  USD_NGN_RATE,
  LOGS_RETAIL_DEFAULT,
  logsWholesaleNgn,
  logsRetailNgnFor,
} from "@/lib/logs-pricing";
import { getSharedLogsPricing } from "@/lib/logs-pricing-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/logs/pricing — the panel's Buy Logs retail multipliers (admin only).
 * PUT /api/logs/pricing — admin-only, saves the three multipliers.
 *
 * Prices shown to customers = wholesale cost × the tier's multiplier.
 * Wholesale cost = parent catalogue price × the parent's fixed multiplier.
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

const TIERS = [
  { id: 0, label: "Small", band: "wholesale up to $1.50", sampleUsd: 0.5 },
  { id: 1, label: "Medium", band: "wholesale $1.51 – $15.00", sampleUsd: 5 },
  { id: 2, label: "Large", band: "wholesale $15.01 and above", sampleUsd: 50 },
];

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  const { retail, persisted } = await getSharedLogsPricing();
  const tiers = TIERS.map((t) => {
    const parentNgn = Math.round(t.sampleUsd * USD_NGN_RATE);
    const wholesaleNgn = logsWholesaleNgn(parentNgn);
    return {
      id: t.id,
      label: t.label,
      band: t.band,
      multiplier: retail[t.id],
      sampleParentNgn: parentNgn,
      sampleWholesaleNgn: wholesaleNgn,
      sampleRetailNgn: logsRetailNgnFor(wholesaleNgn, retail),
    };
  });
  return NextResponse.json({
    ok: true,
    persisted,
    retail,
    defaultRetail: [...LOGS_RETAIL_DEFAULT],
    usdRate: USD_NGN_RATE,
    wholesaleMultipliers: [1.5, 1.25, 1.15],
    tiers,
    note: "Customers pay wholesale cost × your multiplier. Wholesale = Verxor catalogue price × the parent's multiplier (×1.5 / ×1.25 / ×1.15).",
  });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const incoming = Array.isArray(body.retail) ? body.retail : null;
  if (!incoming || incoming.length !== 3) {
    return NextResponse.json({ ok: false, error: "Three multipliers are required (one per tier)." }, { status: 400 });
  }
  const retail: number[] = [];
  for (let i = 0; i < 3; i += 1) {
    const m = Number(incoming[i]);
    if (!Number.isFinite(m) || m < 1 || m > 20) {
      return NextResponse.json(
        { ok: false, error: `${TIERS[i].label} multiplier must be between 1.0 and 20.0` },
        { status: 400 },
      );
    }
    retail.push(m);
  }
  try {
    const db = createServerClient();
    const { error } = await db
      .from("site_settings")
      .update({ logs_pricing: { retail }, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      return NextResponse.json(
        { ok: false, error: "Could not save multipliers. Apply the logs_pricing migration first (SQL: alter table site_settings add column if not exists logs_pricing jsonb)." },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, retail });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not save multipliers" },
      { status: 500 },
    );
  }
}
