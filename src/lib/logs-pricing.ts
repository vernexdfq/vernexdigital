/**
 * Buy Logs pricing for the Vernex Digital panel.
 *
 * The parent (Verxor) sells to us at tiered wholesale over provider cost
 * (rate ₦1,380/$): $0.01–$1.00 ×1.50 · $1.01–$10.00 ×1.25 · $10.01+ ×1.15.
 * The parent catalogue priceNgn already equals providerUsd × 1380, so
 * wholesale = catalogue price × the same tier multiplier.
 *
 * Our retail price to panel customers is tiered over the wholesale price:
 *   wholesale $0.01–$1.50   → ×2.00
 *   wholesale $1.51–$15.00  → ×1.60
 *   wholesale $15.01+        → ×1.22
 */

export const USD_NGN_RATE = 1380;

/** Wholesale multiplier the parent applies over provider cost (USD). */
export function accountsWholesaleMultiplier(providerUsd: number): number {
  if (!Number.isFinite(providerUsd) || providerUsd <= 0) return 1.5;
  if (providerUsd <= 1) return 1.5;
  if (providerUsd <= 10) return 1.25;
  return 1.15;
}

/** Wholesale NGN we pay the parent for one unit of a listing (parent priceNgn basis). */
export function logsWholesaleNgn(parentUnitNgn: number): number {
  const parentUnit = Math.round(Number(parentUnitNgn) || 0);
  if (parentUnit <= 0) return 0;
  const providerUsd = parentUnit / USD_NGN_RATE;
  return Math.max(1, Math.round(parentUnit * accountsWholesaleMultiplier(providerUsd)));
}

/** Retail multiplier we apply over our wholesale cost (wholesale USD basis). */
export function logsRetailMultiplier(wholesaleUsd: number): number {
  if (!Number.isFinite(wholesaleUsd) || wholesaleUsd <= 0) return 2;
  if (wholesaleUsd <= 1.5) return 2;
  if (wholesaleUsd <= 15) return 1.6;
  return 1.22;
}

/** Retail NGN our customer pays for one unit. */
export function logsRetailNgn(wholesaleUnitNgn: number): number {
  const wholesale = Math.round(Number(wholesaleUnitNgn) || 0);
  if (wholesale <= 0) return 0;
  const wholesaleUsd = wholesale / USD_NGN_RATE;
  return Math.max(1, Math.round(wholesale * logsRetailMultiplier(wholesaleUsd)));
}
