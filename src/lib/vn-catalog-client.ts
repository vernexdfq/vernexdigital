"use client";

export type CatalogService = { code: string; name: string; category?: string; fromNgn?: number };
export type CatalogCountry = {
  code: string;
  name: string;
  flag?: string;
  dial?: string;
  grizzlyCode?: string;
  fromNgn?: number;
  stock?: number;
};

export const FALLBACK_SERVICES: CatalogService[] = [
  { code: "wa", name: "WhatsApp" },
  { code: "fb", name: "Facebook" },
  { code: "lf", name: "TikTok" },
  { code: "tg", name: "Telegram" },
  { code: "ig", name: "Instagram" },
  { code: "go", name: "Google" },
  { code: "tw", name: "Twitter" },
  { code: "ds", name: "Discord" },
  { code: "sn", name: "Snapchat" },
  { code: "am", name: "Amazon" },
  { code: "mm", name: "Microsoft" },
  { code: "ap", name: "Apple" },
  { code: "ub", name: "Uber" },
  { code: "pm", name: "PayPal" },
  { code: "bn", name: "Binance" },
  { code: "oi", name: "Tinder" },
  { code: "nf", name: "Netflix" },
  { code: "sp", name: "Spotify" },
  { code: "oa", name: "OpenAI" },
  { code: "st", name: "Steam" },
  { code: "ro", name: "Roblox" },
  { code: "lk", name: "LinkedIn" },
  { code: "rd", name: "Reddit" },
];

/** Curated popular countries only — used if live catalog fails. Not a full world list. */
export const FALLBACK_COUNTRIES: CatalogCountry[] = [
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "+44" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dial: "+49" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", dial: "+234" },
  { code: "FR", name: "France", flag: "🇫🇷", dial: "+33" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", dial: "+31" },
  { code: "IN", name: "India", flag: "🇮🇳", dial: "+91" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dial: "+55" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61" },
  { code: "ES", name: "Spain", flag: "🇪🇸", dial: "+34" },
  { code: "IT", name: "Italy", flag: "🇮🇹", dial: "+39" },
  { code: "PL", name: "Poland", flag: "🇵🇱", dial: "+48" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", dial: "+380" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", dial: "+27" },
  { code: "PH", name: "Philippines", flag: "🇵🇭", dial: "+63" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", dial: "+62" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", dial: "+60" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dial: "+254" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dial: "+233" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dial: "+971" },
];

const COUNTRY_ALIASES: Record<string, string[]> = {
  GB: ["uk", "united kingdom", "britain", "great britain", "england"],
  US: ["usa", "united states", "america"],
  AE: ["uae", "emirates", "dubai"],
  NL: ["holland", "netherlands"],
  CZ: ["czech", "czechia"],
  KR: ["korea", "south korea"],
  RU: ["russia", "russian federation"],
};

export function countryMatchesQuery(c: CatalogCountry, q: string): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    c.name,
    c.code,
    c.dial || "",
    c.grizzlyCode || "",
    ...(COUNTRY_ALIASES[c.code] || []),
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export async function fetchServices(pool: string): Promise<{
  services: CatalogService[];
  live: boolean;
}> {
  try {
    const res = await fetch(`/api/vn/catalog?mode=services&pool=${encodeURIComponent(pool)}`);
    const data = await res.json().catch(() => ({}));
    if (data.ok && Array.isArray(data.services) && data.services.length > 0) {
      const mapped: CatalogService[] = data.services
        .map((s: any) => ({
          code: String(s.code || s.id || ""),
          name: String(s.display_name || s.name || s.code || ""),
          category: s.category,
          fromNgn: s.fromNgn != null ? Number(s.fromNgn) : undefined,
        }))
        .filter((s: CatalogService) => s.code && s.name);
      if (mapped.length > 0) return { services: mapped, live: Boolean(data.live) };
    }
  } catch {}
  return { services: FALLBACK_SERVICES, live: false };
}

/**
 * Load countries that actually have numbers for this service+pool.
 * Prefer stock > 0 when the upstream sends stock.
 */
export async function fetchCountries(pool: string, serviceCode: string): Promise<CatalogCountry[]> {
  if (!serviceCode) return FALLBACK_COUNTRIES;
  try {
    const qs = new URLSearchParams({ mode: "countries", pool, service: serviceCode });
    const res = await fetch(`/api/vn/catalog?${qs}`);
    const data = await res.json().catch(() => ({}));
    if (data.ok && Array.isArray(data.countries) && data.countries.length > 0) {
      let mapped: CatalogCountry[] = data.countries
        .map((c: any) => ({
          code: String(c.code || ""),
          name: String(c.name || c.display_name || c.code || ""),
          flag: c.flag || "🌍",
          dial: c.dial || "",
          grizzlyCode: String(c.grizzlyCode || c.grizzly || c.code || ""),
          fromNgn: c.fromNgn != null ? Number(c.fromNgn) : undefined,
          stock: c.stock != null ? Number(c.stock) : undefined,
        }))
        .filter((c: CatalogCountry) => c.code && c.name);

      const withStock = mapped.filter((c) => c.stock == null || c.stock > 0);
      if (withStock.length > 0) mapped = withStock;

      const popular = new Set(["GB", "US", "DE", "CA", "NG", "FR", "NL", "IN", "BR", "AU", "PH", "ID", "KE", "GH", "AE", "ZA", "PL", "UA"]);
      mapped.sort((a, b) => {
        const ap = popular.has(a.code) ? 0 : 1;
        const bp = popular.has(b.code) ? 0 : 1;
        if (ap !== bp) return ap - bp;
        return a.name.localeCompare(b.name);
      });

      if (mapped.length > 0) return mapped;
    }
  } catch {}
  return FALLBACK_COUNTRIES;
}
