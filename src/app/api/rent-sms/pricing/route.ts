import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";
import {
  RENT_SMS_DEFAULT_MULTIPLIERS,
  RENT_SMS_TIER_LABELS,
  RENT_SMS_TIER_HINTS,
  RENT_SMS_MIN_MULTIPLIER,
  RENT_SMS_MAX_MULTIPLIER,
  rentSmsNormalizeMultipliers,
  rentSmsRoundUp50,
  rentSmsMultiplierFor,
} from "@/lib/rentsms-pricing";
import { getSharedRentSmsPricing } from "@/lib/rentsms-pricing-server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/rent-sms/pricing — admin only. Returns the five tier multipliers
 * plus LIVE sample quotes (what Verxor charges us in Naira, and the verxor.com
 * price) so the admin sees real numbers, not placeholders.
 * PUT /api/rent-sms/pricing — admin-only, saves { multipliers: [5] }.
 *
 * Customer price = our wholesale charge × the tier's multiplier, rounded up to
 * the nearest ₦50. Defaults are Verxor retail ÷ Verxor panel per tier, so
 * nothing saved = sell at the same price as verxor.com.
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

/** Live quotes for one real rental per tier. */
const SAMPLE_QUOTES: { serviceName: string; duration: string; label: string }[] = [
  { serviceName: "whatsapp", duration: "oneDay", label: "WhatsApp · 1 day" },
  { serviceName: "whatsapp", duration: "thirtyDay", label: "WhatsApp · 30 days" },
  { serviceName: "allservices", duration: "sevenDay", label: "All-Services · 7 days" },
  { serviceName: "allservices", duration: "ninetyDay", label: "All-Services · 90 days" },
  { serviceName: "allservices", duration: "oneYear", label: "All-Services · 1 year" },
];

type Sample = {
  label: string;
  tier: number;
  wholesaleNgn: number;
  verxorRetailNgn: number;
  service: string;
  duration: string;
};

async function fetchSamples(multipliers: number[]): Promise<Sample[]> {
  if (!verxorConfig().configured) return [];
  const out: Sample[] = [];
  for (const s of SAMPLE_QUOTES) {
    try {
      const res = await verxorFetch("/rent-sms/quote", {
        method: "POST",
        body: JSON.stringify({ serviceName: s.serviceName, duration: s.duration, areaCode: false }),
      });
      const d = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        priceNgn?: number;
        retailPriceNgn?: number;
        tier?: number;
      };
      if (res.ok && d.ok && Number(d.priceNgn)) {
        const tier = Math.min(Math.max(Number(d.tier) || 1, 1), 5);
        out.push({
          label: s.label,
          tier,
          wholesaleNgn: Math.round(Number(d.priceNgn) || 0),
          verxorRetailNgn: Math.round(Number(d.retailPriceNgn) || 0),
          service: s.serviceName,
          duration: s.duration,
        });
      }
    } catch {
      /* individual sample failures are non-fatal */
    }
  }
  // Attach the current customer price for each sample.
  void multipliers;
  return out;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  const { multipliers, persisted } = await getSharedRentSmsPricing();
  const samples = await fetchSamples(multipliers);
  return NextResponse.json({
    ok: true,
    persisted,
    multipliers,
    defaultMultipliers: [...RENT_SMS_DEFAULT_MULTIPLIERS],
    min: RENT_SMS_MIN_MULTIPLIER,
    max: RENT_SMS_MAX_MULTIPLIER,
    tiers: RENT_SMS_TIER_LABELS.map((label, i) => ({ label, hint: RENT_SMS_TIER_HINTS[i], multiplier: multipliers[i], sample: samples.find((s) => s.tier === i + 1) ?? null })),
    samples: samples.map((s) => ({
      label: s.label,
      tier: s.tier,
      wholesaleNgn: s.wholesaleNgn,
      verxorRetailNgn: s.verxorRetailNgn,
      customerNgn: rentSmsRoundUp50(s.wholesaleNgn * rentSmsMultiplierFor(s.tier, multipliers)),
    })),
    note: "Customers pay your Verxor wholesale charge × the tier multiplier, rounded up to the nearest ₦50. The defaults (Verxor retail ÷ our panel price) sell at the same price as verxor.com.",
  });
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const normalized = rentSmsNormalizeMultipliers(body.multipliers);
  if (!normalized) {
    return NextResponse.json(
      { ok: false, error: `Five multipliers are required (one per tier), each between ${RENT_SMS_MIN_MULTIPLIER} and ${RENT_SMS_MAX_MULTIPLIER}.` },
      { status: 400 },
    );
  }
  try {
    const db = createServerClient();
    const { error } = await db
      .from("site_settings")
      .update({ rent_sms_pricing: { multipliers: normalized }, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not save the multipliers. Apply the migration first (SQL: alter table site_settings add column if not exists rent_sms_pricing jsonb).",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, multipliers: normalized });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not save the multipliers" },
      { status: 500 },
    );
  }
}
