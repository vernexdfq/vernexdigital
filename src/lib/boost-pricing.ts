/** Partner mults locked on Verxor: 2.0 / 1.7 / 1.35 / 1.15 @ ₦1380 */
export const USD_NGN = 1380;

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
 * End-user price on this panel.
 * Default +25% on partner cost so the panel keeps a healthy margin
 * while still usually under Verxor public retail (4/3/2/1.5).
 * Override with BOOST_PANEL_MARKUP (e.g. 0.25 = 25%).
 */
export function panelRetailRatePer1000(wholesaleUsd: number): number {
  const partner = partnerRatePer1000(wholesaleUsd);
  const markup = Number(process.env.BOOST_PANEL_MARKUP ?? "0.25");
  const m = Number.isFinite(markup) && markup >= 0 ? markup : 0.25;
  return Math.round(partner * (1 + m) * 100) / 100;
}

export function orderAmountNgn(ratePer1000: number, quantity: number): number {
  return Math.round((quantity / 1000) * ratePer1000 * 100) / 100;
}
