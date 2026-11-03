/** Partner mults locked on Verxor: 2.0 / 1.7 / 1.35 / 1.15 @ ₦1380 */
export const USD_NGN = 1380;

/** Default markup the panel adds on top of the Verxor partner rate. */
export const BOOST_DEFAULT_MARKUP = 0.25;

/** Markup from environment (legacy fallback when nothing is saved in admin). */
export function boostMarkupFromEnv(): number {
  const markup = Number(process.env.BOOST_PANEL_MARKUP ?? String(BOOST_DEFAULT_MARKUP));
  return Number.isFinite(markup) && markup >= 0 ? markup : BOOST_DEFAULT_MARKUP;
}

export function partnerMult(costUsd: number): number {
  if (costUsd <= 0.5) return 2.0;
  if (costUsd <= 1.0) return 1.7;
  if (costUsd <= 2.0) return 1.35;
  return 1.15;
}

/** What the panel pays Verxor per 1000 */
export function partnerRatePer1000(wholesaleUsd: number): number {
  return Math.round(wholesaleUsd * partnerMult(wholesaleUsd) * USD_NGN * 100) / 100;
}

/**
 * End-user price with an explicit markup (e.g. 0.25 = +25% on partner cost).
 * The markup comes from the admin Boost pricing page (saved in Supabase),
 * falling back to BOOST_PANEL_MARKUP / 25%.
 */
export function retailRatePer1000(wholesaleUsd: number, markup: number): number {
  const partner = partnerRatePer1000(wholesaleUsd);
  const m = Number.isFinite(markup) && markup >= 0 ? markup : BOOST_DEFAULT_MARKUP;
  return Math.round(partner * (1 + m) * 100) / 100;
}

/** Legacy env-based retail rate (kept for compatibility). */
export function panelRetailRatePer1000(wholesaleUsd: number): number {
  return retailRatePer1000(wholesaleUsd, boostMarkupFromEnv());
}

export function orderAmountNgn(ratePer1000: number, quantity: number): number {
  return Math.round((quantity / 1000) * ratePer1000 * 100) / 100;
}
