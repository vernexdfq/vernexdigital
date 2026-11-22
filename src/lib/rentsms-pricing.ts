/**
 * Rent-for-SMS pricing for the Vernex Digital panel.
 *
 * Verxor (parent) prices panel-key quotes at the PANEL tier in Naira
 * (`priceNgn`) and also returns its own retail price (`retailPriceNgn`).
 * Verxor retail is what verxor.com customers pay — by default this panel
 * sells at the SAME price as Verxor retail (multiplier 1.0).
 *
 * The panel's admin can scale that with a single multiplier stored in
 * site_settings.rent_sms_pricing (e.g. 1.2 = 20% above Verxor retail).
 * All prices are rounded UP to the nearest ₦50, matching Verxor.
 */

export const RENT_SMS_DEFAULT_MULTIPLIER = 1.0;

export const RENT_SMS_MIN_MULTIPLIER = 1.0;
export const RENT_SMS_MAX_MULTIPLIER = 5.0;

/** Round a Naira price up to the nearest ₦50 (same rule as Verxor). */
export function rentSmsRoundUp50(naira: number): number {
  const n = Math.ceil(Number(naira) || 0);
  if (n <= 0) return 0;
  return Math.ceil(n / 50) * 50;
}

/** The Verxor wholesale charge we pay (panel-tier quote from the parent). */
export function rentSmsWholesaleNgn(parentPanelPriceNgn: number): number {
  const parent = Math.round(Number(parentPanelPriceNgn) || 0);
  return parent <= 0 ? 0 : Math.max(1, parent);
}

/** Customer price: Verxor retail × admin multiplier, rounded up to ₦50. */
export function rentSmsCustomerNgn(verxorRetailNgn: number, multiplier: number): number {
  const base = Number(verxorRetailNgn) || 0;
  if (base <= 0) return 0;
  const m = Number.isFinite(Number(multiplier))
    ? Math.min(RENT_SMS_MAX_MULTIPLIER, Math.max(RENT_SMS_MIN_MULTIPLIER, Number(multiplier)))
    : RENT_SMS_DEFAULT_MULTIPLIER;
  return rentSmsRoundUp50(base * m);
}

/** Normalize a multiplier from admin input; null when invalid. */
export function rentSmsNormalizeMultiplier(value: unknown): number | null {
  const m = Number(value);
  if (!Number.isFinite(m) || m < RENT_SMS_MIN_MULTIPLIER || m > RENT_SMS_MAX_MULTIPLIER) return null;
  return Math.round(m * 100) / 100;
}
