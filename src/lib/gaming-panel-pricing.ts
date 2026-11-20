import { createServerClient } from "@/lib/supabase/server";

/**
 * Gaming panel pricing — customer prices mark up the Verxor child-panel
 * Naira price. The panel only ever sees that Naira price (never Verxor's
 * USD costs or internal tiers), and applies its own multipliers.
 *
 * Tiers are base-price bands (₦, on the Verxor child price):
 *   t1 ≤ ₦2,000      micro packs
 *   t2 ₦2,001–8,000  small packs
 *   t3 ₦8,001–40,000 standard packs
 *   t4 > ₦40,000     high-value packs
 *
 * Admin-editable via site_settings.gaming_pricing (jsonb) — added in a
 * later migration; until then defaults apply (persisted: false).
 */

export type GamingTier = "t1" | "t2" | "t3" | "t4";
export const GAMING_TIERS: GamingTier[] = ["t1", "t2", "t3", "t4"];

export const GAMING_TIER_META: Record<GamingTier, { label: string; bandNgn: string }> = {
  t1: { label: "Micro", bandNgn: "≤ ₦2,000" },
  t2: { label: "Small", bandNgn: "₦2,001 – ₦8,000" },
  t3: { label: "Standard", bandNgn: "₦8,001 – ₦40,000" },
  t4: { label: "High-Value", bandNgn: "> ₦40,000" },
};

export const GAMING_DEFAULT_MARKUPS: Record<GamingTier, number> = {
  t1: 1.2,
  t2: 1.15,
  t3: 1.1,
  t4: 1.07,
};

export type GamingPricingConfig = { markups?: Partial<Record<GamingTier, number>> };
export type SharedGamingPricing = { markups: Record<GamingTier, number>; persisted: boolean };

function normalizeMarkups(value: GamingPricingConfig | null | undefined): Record<GamingTier, number> | null {
  if (!value || !value.markups || typeof value.markups !== "object") return null;
  const out = {} as Record<GamingTier, number>;
  let valid = false;
  for (const tier of GAMING_TIERS) {
    const m = Number(value.markups[tier]);
    if (Number.isFinite(m) && m >= 1 && m <= 10) {
      out[tier] = m;
      valid = true;
    } else {
      out[tier] = GAMING_DEFAULT_MARKUPS[tier];
    }
  }
  return valid ? out : null;
}

/** Admin-editable multipliers, stored in site_settings.gaming_pricing (jsonb). */
export async function getSharedGamingPricing(): Promise<SharedGamingPricing> {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("site_settings")
      .select("gaming_pricing")
      .eq("id", 1)
      .maybeSingle();
    if (error) return { markups: { ...GAMING_DEFAULT_MARKUPS }, persisted: false };
    const markups = normalizeMarkups(data?.gaming_pricing as GamingPricingConfig | null);
    if (markups) return { markups, persisted: true };
    return { markups: { ...GAMING_DEFAULT_MARKUPS }, persisted: false };
  } catch {
    return { markups: { ...GAMING_DEFAULT_MARKUPS }, persisted: false };
  }
}

/** Tier for a Verxor child Naira price. */
export function gamingTierFor(baseNgn: number): GamingTier {
  const n = Number(baseNgn);
  if (!Number.isFinite(n) || n <= 0) return "t1";
  if (n <= 2000) return "t1";
  if (n <= 8000) return "t2";
  if (n <= 40000) return "t3";
  return "t4";
}

/** Customer price for a Verxor child price: ceil(base × tier markup). */
export function gamingCustomerPrice(baseNgn: number, markups: Record<GamingTier, number>): number {
  if (!Number.isFinite(baseNgn) || baseNgn <= 0) return 0;
  const tier = gamingTierFor(baseNgn);
  return Math.ceil(baseNgn * markups[tier]);
}
