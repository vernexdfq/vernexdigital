import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { panelRetailRatePer1000, partnerRatePer1000 } from "@/lib/boost-pricing";

export type CachedService = {
  id: string;
  providerId: number;
  platform: string;
  platformName: string;
  category: string;
  categoryName: string;
  title: string;
  name: string;
  group: string;
  categoryId: string;
  ratePer1000: number;
  partnerRatePer1000: number;
  wholesaleUsd: number;
  min: number;
  max: number;
  speed: string;
  refill?: boolean | string;
  quality?: string;
  instant?: boolean;
  desc?: string;
};

export type CachedPlatform = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  brandColor: string;
  initial: string;
  placeholder: string;
  linkHint: string;
  urlPatternStr: string;
  categories: unknown[];
  totalServices: number;
};

export type CatalogSnapshot = {
  ok: true;
  source: "live" | "cache" | "stale_fallback";
  rate: number;
  updatedAt: string;
  totalPlatforms: number;
  totalServices: number;
  platforms: CachedPlatform[];
  services: CachedService[];
  pricing: {
    mode: string;
    markup: number;
    note: string;
  };
};

type CacheEntry = {
  data: CatalogSnapshot;
  cachedAt: number;
};

// In-memory catalog cache for the Node.js server runtime
let memoryCache: CacheEntry | null = null;

// Durations in milliseconds:
// - FRESH_TTL (5 minutes): return cached catalog immediately
// - STALE_MAX_AGE (60 minutes): allowed fallback if Verxor is down, with stale warning
const FRESH_TTL_MS = 5 * 60 * 1000;
const STALE_MAX_AGE_MS = 60 * 60 * 1000;

function transformCatalogPayload(data: Record<string, unknown>): CatalogSnapshot {
  const rawServices = Array.isArray(data.services) ? data.services : [];
  const rawPlatforms = Array.isArray(data.platforms) ? data.platforms : [];

  const services: CachedService[] = rawServices.map((s: Record<string, unknown>) => {
    const wholesaleUsd = Number(s.wholesaleUsd) || 0;
    const ratePer1000 = panelRetailRatePer1000(wholesaleUsd);
    const partnerRate = partnerRatePer1000(wholesaleUsd);
    const platform = String(s.platform || "");
    const platformName = String(s.platformName || s.platform || "");
    const category = String(s.category || "");
    const categoryName = String(s.categoryName || s.category || "General");
    const title = String(s.title || s.name || "");

    return {
      id: String(s.id ?? s.providerId ?? ""),
      providerId: Number(s.providerId) || Number(s.id) || 0,
      platform,
      platformName,
      category,
      categoryName,
      title,
      name: title,
      group: categoryName,
      categoryId: platform,
      ratePer1000,
      partnerRatePer1000: partnerRate,
      wholesaleUsd,
      min: Number(s.min) || 1,
      max: Number(s.max) || 1000000,
      speed: String(s.speed || ""),
      refill: s.refill as boolean | string | undefined,
      quality: s.quality ? String(s.quality) : undefined,
      instant: Boolean(s.instant),
      desc: s.desc ? String(s.desc) : undefined,
    };
  });

  const platforms: CachedPlatform[] = rawPlatforms.map((p: Record<string, unknown>) => ({
    id: String(p.id || ""),
    name: String(p.name || ""),
    shortName: String(p.shortName || p.name || ""),
    color: String(p.brandColor || "#0F172A"),
    brandColor: String(p.brandColor || "#0F172A"),
    initial: String(p.shortName || p.name || "")
      .slice(0, 2)
      .toUpperCase(),
    placeholder: String(p.placeholder || "https://"),
    linkHint: String(p.linkHint || "Paste your link"),
    urlPatternStr: String(p.urlPatternStr || "https?:\\/\\/"),
    categories: Array.isArray(p.categories) ? p.categories : [],
    totalServices: Number(p.totalServices) || 0,
  }));

  return {
    ok: true,
    source: "live",
    rate: Number(data.rate) || 1380,
    updatedAt: (data.updatedAt as string) || new Date().toISOString(),
    totalPlatforms: platforms.length,
    totalServices: services.length,
    platforms,
    services,
    pricing: {
      mode: "partner_plus_markup",
      markup: Number(process.env.BOOST_PANEL_MARKUP ?? "0.25"),
      note: "Panel pays Verxor partner rate; end users pay partner × (1+markup)",
    },
  };
}

/**
 * Fetch or retrieve cached catalog.
 * - forceRefresh: bypass fresh cache, force re-fetch from Verxor
 * - allowStale: if Verxor is down/unreachable, return memory cache if within STALE_MAX_AGE_MS
 */
export async function getAuthoritativeCatalog(opts: {
  forceRefresh?: boolean;
  allowStale?: boolean;
} = {}): Promise<{
  data: CatalogSnapshot | null;
  fromCache: boolean;
  isStale: boolean;
  error?: string;
}> {
  const now = Date.now();
  const { configured, base } = verxorConfig();

  // 1. Fresh cache hit
  if (
    !opts.forceRefresh &&
    memoryCache &&
    now - memoryCache.cachedAt < FRESH_TTL_MS
  ) {
    return {
      data: { ...memoryCache.data, source: "cache" },
      fromCache: true,
      isStale: false,
    };
  }

  // 2. Fetch live from Verxor
  try {
    const path = `/boost/catalog${opts.forceRefresh ? "?refresh=1" : ""}`;
    const res = configured
      ? await verxorFetch(path)
      : await fetch(`${base}${path}`, { cache: "no-store" });

    const raw = await res.json().catch(() => ({}));
    if (res.ok && raw && raw.ok !== false && Array.isArray(raw.services)) {
      const snapshot = transformCatalogPayload(raw);
      memoryCache = { data: snapshot, cachedAt: now };
      return { data: snapshot, fromCache: false, isStale: false };
    }
  } catch (err) {
    console.error("[boost-catalog-cache] Live fetch error:", err);
  }

  // 3. Fallback to stale cache if allowed (e.g. for display, or if within safe staleness threshold)
  if (
    opts.allowStale !== false &&
    memoryCache &&
    now - memoryCache.cachedAt < STALE_MAX_AGE_MS
  ) {
    console.warn(
      "[boost-catalog-cache] Provider unavailable. Returning stale catalog cache (age: %ds)",
      Math.round((now - memoryCache.cachedAt) / 1000)
    );
    return {
      data: { ...memoryCache.data, source: "stale_fallback" },
      fromCache: true,
      isStale: true,
    };
  }

  // 4. Stale cache expired or no cache available
  return {
    data: null,
    fromCache: false,
    isStale: true,
    error: "Service catalog is temporarily unavailable from upstream provider.",
  };
}
