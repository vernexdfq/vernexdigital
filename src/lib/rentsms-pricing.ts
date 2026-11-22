/**
 * Rent-for-SMS pricing for the Vernex Digital panel.
 *
 * Verxor (parent) charges us the PANEL-TIER wholesale price in Naira
 * (`priceNgn` on our panel-key quotes) and reports which of its 5 cost tiers
 * the rental falls in. Our customer price is:
 *
 *     customer = our wholesale charge (Naira) × our tier multiplier
 *
 * DEFAULT MULTIPLIERS = Verxor retail ÷ Verxor panel multiplier per tier,
 * rounded to 2 decimals — so by default we sell at the SAME price as
 * verxor.com customers:
 *
 *   Tier 1: 1.80 / 1.25 = 1.44  Tier 2: 1.38 / 1.12 = 1.23
 *   Tier 3: 1.25 / 1.10 = 1.14  Tier 4: 1.15 / 1.06 = 1.08
 *   Tier 5: 1.10 / 1.03 = 1.07
 *
 * Common pitfall (why these are ratios, not differences): our cost is already
 * 1.25× the provider base in Tier 1. Adding the raw difference (1.80 − 1.25 =
 * 0.55) would put us at 1.25 × 1.55 = 1.94× base — ABOVE verxor.com. Only the
 * ratio 1.80 / 1.25 = 1.44 lands exactly on their retail price.
 *
 * Admin can edit all five multipliers in site_settings.rent_sms_pricing.
 * All prices are rounded UP to the nearest ₦50, matching Verxor.
 */

export const RENT_SMS_MULTIPLIER_COUNT = 5;

/** Default per-tier multipliers on OUR wholesale cost (retail ÷ panel). */
export const RENT_SMS_DEFAULT_MULTIPLIERS = [1.44, 1.23, 1.14, 1.08, 1.07] as const;

export const RENT_SMS_MIN_MULTIPLIER = 1.0;
export const RENT_SMS_MAX_MULTIPLIER = 5.0;

/** Tier names shown to the admin (same bands as the Verxor tier table). */
export const RENT_SMS_TIER_LABELS = [
  "Short & small",
  "Standard single-app",
  "All-Services & mid",
  "Long multi-month",
  "Annual",
] as const;

export const RENT_SMS_TIER_HINTS = [
  "1–3 day single-app rentals",
  "7–30 day WhatsApp and similar",
  "All-Services lines & mid-range",
  "Long multi-month lines",
  "1-year lines",
] as const;

/** Round a Naira price up to the nearest ₦50 (same rule as Verxor). */
export function rentSmsRoundUp50(naira: number): number {
  const n = Math.ceil(Number(naira) || 0);
  if (n <= 0) return 0;
  return Math.ceil(n / 50) * 50;
}

/**
 * Multiplier for a Verxor tier (1–5) from a live admin-saved list.
 * Falls back to the defaults when unset or invalid.
 */
export function rentSmsMultiplierFor(tier: number, multipliers: number[] | null | undefined): number {
  const fallback = RENT_SMS_DEFAULT_MULTIPLIERS[Math.min(Math.max(tier, 1), 5) - 1];
  const value = Number(multipliers?.[Math.min(Math.max(tier, 1), 5) - 1]);
  if (Number.isFinite(value) && value >= RENT_SMS_MIN_MULTIPLIER && value <= RENT_SMS_MAX_MULTIPLIER) {
    return Math.round(value * 100) / 100;
  }
  return fallback;
}

/** Customer price: our wholesale charge × tier multiplier, rounded up to ₦50. */
export function rentSmsCustomerNgn(wholesaleNgn: number, multiplier: number): number {
  const wholesale = Number(wholesaleNgn) || 0;
  if (wholesale <= 0) return 0;
  return rentSmsRoundUp50(wholesale * multiplier);
}

/** Normalize a 5-slot multiplier table from admin input; null when invalid. */
export function rentSmsNormalizeMultipliers(value: unknown): number[] | null {
  if (!Array.isArray(value) || value.length !== RENT_SMS_MULTIPLIER_COUNT) return null;
  const out: number[] = [];
  for (let i = 0; i < RENT_SMS_MULTIPLIER_COUNT; i += 1) {
    const m = Number(value[i]);
    if (!Number.isFinite(m) || m < RENT_SMS_MIN_MULTIPLIER || m > RENT_SMS_MAX_MULTIPLIER) return null;
    out.push(Math.round(m * 100) / 100);
  }
  return out;
}
