import { createServerClient } from "@/lib/supabase/server";
import {
  BOOST_DEFAULT_MARKUPS,
  BOOST_TIERS,
  type BoostTier,
} from "@/lib/boost-pricing";

export type BoostPricingConfig = {
  markups?: Partial<Record<BoostTier, number>>;
  /** Legacy single-markup format (fraction, e.g. 0.25). */
  markup?: number;
};

export type SharedBoostPricing = {
  markups: Record<BoostTier, number>;
  persisted: boolean;
};

function normalizeMarkups(value: BoostPricingConfig | null | undefined): Record<BoostTier, number> | null {
  if (!value) return null;

  // Current format: per-tier multipliers (e.g. 1.25)
  if (value.markups && typeof value.markups === "object") {
    const out = {} as Record<BoostTier, number>;
    let valid = false;
    for (const tier of BOOST_TIERS) {
      const m = Number(value.markups[tier]);
      if (Number.isFinite(m) && m >= 1 && m <= 10) {
        out[tier] = m;
        valid = true;
      } else {
        out[tier] = BOOST_DEFAULT_MARKUPS[tier];
      }
    }
    return valid ? out : null;
  }

  // Legacy format: single fraction markup (0.25 → ×1.25 on every tier)
  const legacy = Number(value.markup);
  if (Number.isFinite(legacy) && legacy >= 0 && legacy <= 9) {
    const mult = 1 + legacy;
    return { economy: mult, standard: mult, fast: mult, premium: mult };
  }

  return null;
}

/**
 * Admin-editable boost tier multipliers, stored in site_settings.boost_pricing (jsonb).
 * The panel sees only the Verxor Naira price; customers pay that price × these
 * multipliers. Falls back to defaults (×1.25 per tier) when nothing is saved
 * or the boost_pricing column has not been migrated.
 */
export async function getSharedBoostPricing(): Promise<SharedBoostPricing> {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("site_settings")
      .select("boost_pricing")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      return { markups: { ...BOOST_DEFAULT_MARKUPS }, persisted: false };
    }
    const markups = normalizeMarkups(data?.boost_pricing as BoostPricingConfig | null);
    if (markups) return { markups, persisted: true };
    return { markups: { ...BOOST_DEFAULT_MARKUPS }, persisted: false };
  } catch {
    return { markups: { ...BOOST_DEFAULT_MARKUPS }, persisted: false };
  }
}
