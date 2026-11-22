import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";
import {
  RENT_SMS_DEFAULT_MULTIPLIER,
  RENT_SMS_MIN_MULTIPLIER,
  RENT_SMS_MAX_MULTIPLIER,
} from "@/lib/rentsms-pricing";
import { getSharedRentSmsPricing } from "@/lib/rentsms-pricing-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/rent-sms/pricing — the panel's Rent-for-SMS multiplier (admin only).
 * PUT /api/rent-sms/pricing — admin-only, saves the multiplier.
 *
 * Customers pay Verxor retail × this multiplier (default 1.0 — the same
 * price as verxor.com), rounded up to the nearest ₦50.
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

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  const { multiplier, persisted } = await getSharedRentSmsPricing();
  return NextResponse.json({
    ok: true,
    persisted,
    multiplier,
    defaultMultiplier: RENT_SMS_DEFAULT_MULTIPLIER,
    min: RENT_SMS_MIN_MULTIPLIER,
    max: RENT_SMS_MAX_MULTIPLIER,
    note: "Customers pay Verxor retail × this multiplier, rounded up to the nearest ₦50. 1.0 sells at the same price as verxor.com.",
  });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const m = Number(body.multiplier);
  if (!Number.isFinite(m) || m < RENT_SMS_MIN_MULTIPLIER || m > RENT_SMS_MAX_MULTIPLIER) {
    return NextResponse.json(
      { ok: false, error: `Multiplier must be between ${RENT_SMS_MIN_MULTIPLIER} and ${RENT_SMS_MAX_MULTIPLIER}.` },
      { status: 400 },
    );
  }
  const multiplier = Math.round(m * 100) / 100;
  try {
    const db = createServerClient();
    const { error } = await db
      .from("site_settings")
      .update({ rent_sms_pricing: { multiplier }, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not save the multiplier. Apply the migration first (SQL: alter table site_settings add column if not exists rent_sms_pricing jsonb).",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, multiplier });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not save the multiplier" },
      { status: 500 },
    );
  }
}
