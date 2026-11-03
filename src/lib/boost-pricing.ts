/** Verxor wholesale conversion (server-side only — never expose to the panel client). */
export const USD_NGN = 1380;

export type BoostTier = "economy" | "standard" | "fast" | "premium";
export const BOOST_TIERS: BoostTier[] = ["economy", "standard", "fast", "premium"];

/**
 * Default panel multipliers on top of the Verxor Naira price, per tier.
 * The panel only ever sees the Verxor Naira price and edits these multipliers.
 */
export const BOOST_DEFAULT_MARKUPS: Record<BoostTier, number> = {
  economy: 1.25,
  standard: 1.25,
  fast: 1.25,
  premium: 1.25,
};

/** Tier metadata safe to show the panel (labels only, no Verxor internals). */
export const BOOST_TIER_META: Record<
  BoostTier,
  { label: string; blurb: string; sampleNgn: number }
> = {
  economy: { label: "Economy", blurb: "Cheapest services", sampleNgn: 500 },
  standard: { label: "Standard", blurb: "Mid-range services", sampleNgn: 1500 },
  fast: { label: "Fast", blurb: "Faster delivery services", sampleNgn: 2500 },
  premium: { label: "Premium", blurb: "Highest quality services", sampleNgn: 5000 },
};

/* ------------------------------------------------------------------
 * Verxor-internal pricing. These figures (wholesale USD bands and
 * partner multipliers) are confidential to Verxor and must never be
 * sent to the panel client or shown in the panel admin UI.
 * ------------------------------------------------------------------ */

function partnerMult(costUsd: number): number {
  if (costUsd <= 0.5) return 2.0;
  if (costUsd <= 1.0) return 1.7;
  if (costUsd <= 2.0) return 1.35;
  return 1.15;
}

/** What the panel pays Verxor per 1,000 (internal). */
export function partnerRatePer1000(wholesaleUsd: number): number {
  return Math.round(wholesaleUsd * partnerMult(wholesaleUsd) * USD_NGN * 100) / 100;
}

/** Classify a provider service into a tier (server-side only). */
export function tierFromWholesaleUsd(usd: number): BoostTier {
  if (usd <= 0.5) return "economy";
  if (usd <= 1.0) return "standard";
  if (usd <= 2.0) return "fast";
  return "premium";
}

function tierMultiplier(
  markups: Partial<Record<BoostTier, number>> | null | undefined,
  tier: BoostTier,
): number {
  const m = Number(markups?.[tier]);
  return Number.isFinite(m) && m >= 1 && m <= 10 ? m : BOOST_DEFAULT_MARKUPS[tier];
}

/**
 * Retail price the panel's customers pay:
 *   Verxor Naira price × the panel's multiplier for that tier.
 */
export function retailRatePer1000(
  wholesaleUsd: number,
  markups: Partial<Record<BoostTier, number>> | null | undefined,
): number {
  const tier = tierFromWholesaleUsd(wholesaleUsd);
  return (
    Math.round(partnerRatePer1000(wholesaleUsd) * tierMultiplier(markups, tier) * 100) / 100
  );
}

/** Legacy env-based fallback (single fraction markup, e.g. 0.25 = ×1.25). */
export function boostMarkupFromEnv(): number {
  const markup = Number(process.env.BOOST_PANEL_MARKUP ?? "0.25");
  return Number.isFinite(markup) && markup >= 0 ? markup : 0.25;
}

/** Legacy env-based retail rate (kept for compatibility with old callers). */
export function panelRetailRatePer1000(wholesaleUsd: number): number {
  const mult = 1 + boostMarkupFromEnv();
  return Math.round(partnerRatePer1000(wholesaleUsd) * mult * 100) / 100;
}

export function orderAmountNgn(ratePer1000: number, quantity: number): number {
  return Math.round((quantity / 1000) * ratePer1000 * 100) / 100;
}
