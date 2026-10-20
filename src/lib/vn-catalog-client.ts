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
];

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

export async function fetchCountries(pool: string, serviceCode: string): Promise<CatalogCountry[]> {
  if (!serviceCode) return FALLBACK_COUNTRIES;
  try {
    const qs = new URLSearchParams({ mode: "countries", pool, service: serviceCode });
    const res = await fetch(`/api/vn/catalog?${qs}`);
    const data = await res.json().catch(() => ({}));
    if (data.ok && Array.isArray(data.countries) && data.countries.length > 0) {
      const mapped: CatalogCountry[] = data.countries
        .map((c: any) => ({
          code: String(c.code || ""),
          name: String(c.name || c.code || ""),
          flag: c.flag || "🌍",
          dial: c.dial || "",
          grizzlyCode: c.grizzlyCode || c.code,
          fromNgn: c.fromNgn != null ? Number(c.fromNgn) : undefined,
          stock: c.stock != null ? Number(c.stock) : undefined,
        }))
        .filter((c: CatalogCountry) => c.code && c.name);
      if (mapped.length > 0) return mapped;
    }
  } catch {}
  return FALLBACK_COUNTRIES;
}
