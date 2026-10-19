/**
 * Verxor → child-panel API pricing (NGN).
 * Provider cost arrives as NGN (USD × 1380 on Verxor).
 * Panel pays Verxor: cost_ngn × tier multiplier.
 * Panel may add its own markup for end users separately.
 */
export const NGN_RATE = 1380;

/** API multipliers (what Verxor charges the panel) */
export const API_MULT = {
  economy: 3.0,
  standard: 2.5,
  fast: 2.0,
  premium: 1.5,
} as const;

export type PoolTier = keyof typeof API_MULT;

/** Typical cost bands in NGN (documentation / matching) */
export const COST_BANDS_NGN = {
  economy: { max: 1035 },
  standard: { min: 1035, max: 1794 },
  fast: { min: 1672.9, max: 3312 },
  premium: { min: 3174 },
} as const;

/** Map UI pool ids (usa-s1 …) → Verxor catalog pool ids */
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

/**
 * Wholesale price panel pays Verxor (NGN).
 * costNgn = provider cost already in naira, OR costUsd * NGN_RATE
 */
export function panelWholesaleNgn(opts: {
  costNgn?: number | null;
  costUsd?: number | null;
  tier: PoolTier;
}): number {
  const { tier } = opts;
  const mult = API_MULT[tier] ?? 2;
  let cost =
    opts.costNgn != null && Number.isFinite(opts.costNgn)
      ? Number(opts.costNgn)
      : opts.costUsd != null && Number.isFinite(opts.costUsd)
        ? Number(opts.costUsd) * NGN_RATE
        : 0;
  if (cost <= 0) return 0;
  return Math.ceil(cost * mult);
}

/** Default panel markup on top of Verxor wholesale (end-user price). Override via env PANEL_MARKUP_PERCENT */
export function endUserPriceNgn(wholesaleNgn: number, markupPercent = 15): number {
  if (wholesaleNgn <= 0) return 0;
  return Math.ceil(wholesaleNgn * (1 + markupPercent / 100));
}
