/**
 * Buy Logs pricing for the Vernex Digital panel.
 *
 * The parent catalogue (fetched with our panel key) already prices every
 * listing at the VERXOR CHARGE in Naira — Verxor's wholesale price for this
 * panel. No further wholesale layer is applied here: charging more than the
 * catalogue price would be double-counting Verxor's own multiplier.
 *
 * Our retail price to panel customers is tiered over that Verxor charge:
 *   charge up to ₦2,070   → ×2.00
 *   ₦2,071 – ₦20,700      → ×1.60
 *   ₦20,701 and above     → ×1.22
 */

export const USD_NGN_RATE = 1380;

/** Default retail multipliers over our wholesale cost, by wholesale USD tier. */
export const LOGS_RETAIL_DEFAULT = [2, 1.6, 1.22] as const;

/** The Verxor charge we pay for one unit — the panel-key catalogue price itself
 *  is already Verxor's wholesale Naira price for us (do not re-markup it). */
export function logsWholesaleNgn(parentUnitNgn: number): number {
  const parentUnit = Math.round(Number(parentUnitNgn) || 0);
  return parentUnit <= 0 ? 0 : Math.max(1, parentUnit);
}

/** Retail multiplier tier index for a wholesale cost, in USD. */
export function logsRetailTier(wholesaleUsd: number): 0 | 1 | 2 {
  if (!Number.isFinite(wholesaleUsd) || wholesaleUsd <= 0) return 0;
  if (wholesaleUsd <= 1.5) return 0;
  if (wholesaleUsd <= 15) return 1;
  return 2;
}

/** Retail multiplier from a live admin-saved list (falls back to defaults). */
export function logsRetailMultiplierFor(
  wholesaleUsd: number,
  retail: number[] | null | undefined,
): number {
  const tier = logsRetailTier(wholesaleUsd);
  const value = Number(retail?.[tier]);
  if (Number.isFinite(value) && value >= 1 && value <= 20) return value;
  return LOGS_RETAIL_DEFAULT[tier];
}

/** Retail NGN our customer pays for one unit, using live admin multipliers. */
export function logsRetailNgnFor(
  wholesaleUnitNgn: number,
  retail: number[] | null | undefined,
): number {
  const wholesale = Math.round(Number(wholesaleUnitNgn) || 0);
  if (wholesale <= 0) return 0;
  return Math.max(1, Math.round(wholesale * logsRetailMultiplierFor(wholesale / USD_NGN_RATE, retail)));
}

/** Retail NGN with the default multipliers (kept for reference/defaults). */
export function logsRetailNgn(wholesaleUnitNgn: number): number {
  return logsRetailNgnFor(wholesaleUnitNgn, null);
}
