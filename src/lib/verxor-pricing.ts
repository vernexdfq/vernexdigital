/**
 * Two-layer virtual-number pricing (all NGN display; FX = 1380).
 *
 * 1) VERXOR → PANEL (wholesale)
 *    From provider USD:
 *      Economy  < $0.50        × 1.5
 *      Standard $0.50 – $1.00  × 1.3
 *      Fast     $1.01 – $2.00  × 1.2
 *      Premium  > $2.00        × 1.15
 *    panel_pays = ceil(provider_usd × 1380 × wholesale_mult)
 *
 * 2) PANEL → CUSTOMER (retail, default until admin pricing page exists)
 *    From wholesale cost in NGN:
 *      Economy  cost < 1035           × 3.0
 *      Standard 1035 – 1794           × 2.5
 *      Fast     1672.9 – 3312         × 2.0
 *      Premium  > 3174                × 1.5
 *    customer_pays = ceil(wholesale_ngn × retail_mult)
 */

export const NGN_RATE = 1380;

/** What Verxor charges the panel (by provider USD band / pool tier) */
export const WHOLESALE_MULT = {
  economy: 1.5,
  standard: 1.3,
  fast: 1.2,
  premium: 1.15,
} as const;

/** Default what panel charges end users (by wholesale ₦ cost band) */
export const RETAIL_MULT = {
  economy: 3.0,
  standard: 2.5,
  fast: 2.0,
  premium: 1.5,
} as const;

export type PoolTier = keyof typeof WHOLESALE_MULT;

/** Provider USD bands that define Verxor pool tiers */
export const PROVIDER_USD_BANDS = {
  economy: { maxUsd: 0.5 },
  standard: { minUsd: 0.5, maxUsd: 1.0 },
  fast: { minUsd: 1.01, maxUsd: 2.0 },
  premium: { minUsd: 2.0 },
} as const;

/** Wholesale ₦ bands for default panel retail multiplier */
export const RETAIL_COST_BANDS_NGN = {
  economy: { max: 1035 },
  standard: { min: 1035, max: 1794 },
  fast: { min: 1672.9, max: 3312 },
  premium: { min: 3174 },
} as const;

/** UI pool id → Verxor catalog pool + tier */
export const UI_POOL_TO_VERXOR: Record<string, { verxorPool: string; tier: PoolTier }> = {
  "usa-s1": { verxorPool: "usa-economy", tier: "economy" },
  "usa-s2": { verxorPool: "usa-standard", tier: "standard" },
  "usa-s3": { verxorPool: "usa-fast", tier: "fast" },
  "usa-s4": { verxorPool: "usa-premium", tier: "premium" },
  "all-s1": { verxorPool: "worldwide-economy", tier: "economy" },
  "all-s2": { verxorPool: "worldwide-standard", tier: "standard" },
  "all-s3": { verxorPool: "worldwide-fast", tier: "fast" },
  "all-s4": { verxorPool: "worldwide-premium", tier: "premium" },
};

export const SERVICE_NAME_TO_CODE: Record<string, string> = {
  WhatsApp: "wa",
  Facebook: "fb",
  TikTok: "lf",
  Telegram: "tg",
  Instagram: "ig",
  Google: "go",
  Twitter: "tw",
  Discord: "ds",
  Snapchat: "sn",
  Amazon: "am",
  Microsoft: "mm",
  Apple: "ap",
  Uber: "ub",
  PayPal: "pm",
  Binance: "bn",
  Tinder: "oi",
  Netflix: "nf",
  Spotify: "sp",
  LinkedIn: "lk",
  Reddit: "rd",
  Steam: "st",
  Roblox: "ro",
  OpenAI: "oa",
  Signal: "si",
  Viber: "vi",
};

/** Infer wholesale tier from provider USD when pool tier is unknown */
export function tierFromProviderUsd(usd: number): PoolTier {
  if (!Number.isFinite(usd) || usd < 0.5) return "economy";
  if (usd <= 1.0) return "standard";
  if (usd <= 2.0) return "fast";
  return "premium";
}

/**
 * Infer retail tier from wholesale ₦ cost (panel default).
 * Prefer non-overlapping order: <1035 economy, ≤1794 standard, ≤3312 fast, else premium.
 */
export function retailTierFromWholesaleNgn(wholesaleNgn: number): PoolTier {
  if (!Number.isFinite(wholesaleNgn) || wholesaleNgn < 1035) return "economy";
  if (wholesaleNgn <= 1794) return "standard";
  if (wholesaleNgn <= 3312) return "fast";
  return "premium";
}

/**
 * Price panel pays Verxor (NGN).
 * Prefer costUsd (provider). Tier from pool, or from USD band if omitted.
 */
export function panelWholesaleNgn(opts: {
  costUsd?: number | null;
  costNgn?: number | null;
  tier?: PoolTier | null;
}): number {
  const costUsd =
    opts.costUsd != null && Number.isFinite(opts.costUsd) ? Number(opts.costUsd) : null;
  const costNgn =
    opts.costNgn != null && Number.isFinite(opts.costNgn) ? Number(opts.costNgn) : null;

  const providerNgn =
    costUsd != null ? costUsd * NGN_RATE : costNgn != null ? costNgn : 0;
  if (providerNgn <= 0) return 0;

  const tier =
    opts.tier ||
    (costUsd != null ? tierFromProviderUsd(costUsd) : "economy");
  const mult = WHOLESALE_MULT[tier] ?? 1.15;
  return Math.ceil(providerNgn * mult);
}

/**
 * Default end-user price on vernexdigital (NGN).
 * Uses wholesale ₦ cost bands × RETAIL_MULT. Admin can override later.
 */
export function endUserPriceNgn(wholesaleNgn: number, retailTier?: PoolTier | null): number {
  if (!Number.isFinite(wholesaleNgn) || wholesaleNgn <= 0) return 0;
  const tier = retailTier || retailTierFromWholesaleNgn(wholesaleNgn);
  const mult = RETAIL_MULT[tier] ?? 1.5;
  return Math.ceil(wholesaleNgn * mult);
}

/** Full quote from provider USD + pool tier */
export function quoteFromProviderUsd(costUsd: number, poolTier?: PoolTier | null) {
  const tier = poolTier || tierFromProviderUsd(costUsd);
  const wholesaleNgn = panelWholesaleNgn({ costUsd, tier });
  const retailTier = retailTierFromWholesaleNgn(wholesaleNgn);
  const priceNgn = endUserPriceNgn(wholesaleNgn, retailTier);
  return {
    costUsd,
    tier,
    wholesaleMult: WHOLESALE_MULT[tier],
    wholesaleNgn,
    retailTier,
    retailMult: RETAIL_MULT[retailTier],
    priceNgn,
  };
}
