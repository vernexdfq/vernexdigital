export const VN_PRICING_KEY = "vernexdigital_vn_pricing_v1";

export type VnTierId = "economy" | "standard" | "fast" | "premium";

export type VnTierPricing = {
  minNgn: number | null; // null = no floor
  maxNgn: number | null; // null = no ceiling
  markup: number; // customer pays ceil(wholesale * markup)
};

export type VnPricingConfig = {
  tiers: Record<VnTierId, VnTierPricing>;
};

export const VN_DEFAULT_PRICING: VnPricingConfig = {
  tiers: {
    economy: { minNgn: null, maxNgn: 1035, markup: 3.0 },
    standard: { minNgn: 1035, maxNgn: 1794, markup: 2.5 },
    fast: { minNgn: 1794, maxNgn: 3312, markup: 2.0 },
    premium: { minNgn: 3312, maxNgn: null, markup: 1.5 },
  },
};

export function loadVnPricing(): VnPricingConfig {
  if (typeof window === "undefined") return VN_DEFAULT_PRICING;
  try {
    const raw = window.localStorage.getItem(VN_PRICING_KEY);
    if (!raw) return VN_DEFAULT_PRICING;
    const parsed = JSON.parse(raw) as Partial<VnPricingConfig>;
    const tiers = parsed?.tiers;
    if (!tiers) return VN_DEFAULT_PRICING;
    const merged: Record<VnTierId, VnTierPricing> = {
      economy: { ...VN_DEFAULT_PRICING.tiers.economy, ...tiers.economy },
      standard: { ...VN_DEFAULT_PRICING.tiers.standard, ...tiers.standard },
      fast: { ...VN_DEFAULT_PRICING.tiers.fast, ...tiers.fast },
      premium: { ...VN_DEFAULT_PRICING.tiers.premium, ...tiers.premium },
    };
    return { tiers: merged };
  } catch {
    return VN_DEFAULT_PRICING;
  }
}

export function saveVnPricing(config: VnPricingConfig) {
  window.localStorage.setItem(VN_PRICING_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("vernex-vn-pricing-updated"));
}

/** Match a wholesale base cost to its pricing tier (Economy up to Premium). */
export function resolveVnTier(baseNgn: number, config: VnPricingConfig = loadVnPricing()): VnTierId {
  const t = config.tiers;
  if (t.economy.maxNgn == null || baseNgn <= t.economy.maxNgn) return "economy";
  if (t.standard.maxNgn == null || baseNgn <= t.standard.maxNgn) return "standard";
  if (t.fast.maxNgn == null || baseNgn <= t.fast.maxNgn) return "fast";
  return "premium";
}

/** Customer price for a wholesale base cost: base x tier markup. */
export function vnCustomerPrice(baseNgn: number, config?: VnPricingConfig): number {
  if (!Number.isFinite(baseNgn) || baseNgn <= 0) return 0;
  const cfg = config ?? loadVnPricing();
  const markup = Number(cfg.tiers[resolveVnTier(baseNgn, cfg)].markup);
  return Math.ceil(baseNgn * (markup > 0 ? markup : 1));
}
