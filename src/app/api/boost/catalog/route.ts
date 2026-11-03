import { NextResponse } from "next/server";
import { getAuthoritativeCatalog } from "@/lib/boost-catalog-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live SMM catalog with server-side caching and stale fallback handling.
 * - Caches Verxor catalog for 5 minutes in server memory.
 * - Allows ?refresh=1 to bypass cache.
 * - Falls back to safe cached catalog if Verxor is momentarily down, marking source: "stale_fallback".
 *
 * IMPORTANT: wholesale and partner pricing fields are Verxor-confidential.
 * Services are whitelisted below so the panel client only ever sees its own
 * retail prices — never the wholesale cost or Verxor partner figures.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "1" || searchParams.get("refresh") === "true";

  const { data, fromCache, isStale, error } = await getAuthoritativeCatalog({
    forceRefresh,
    allowStale: true,
  });

  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        error: error || "Services catalog is temporarily unavailable. Please retry in a few moments.",
      },
      { status: 503 },
    );
  }

  const services = data.services.map((s) => ({
    id: s.id,
    providerId: s.providerId,
    platform: s.platform,
    platformName: s.platformName,
    category: s.category,
    categoryName: s.categoryName,
    title: s.title,
    name: s.name,
    group: s.group,
    categoryId: s.categoryId,
    ratePer1000: s.ratePer1000,
    min: s.min,
    max: s.max,
    speed: s.speed,
    refill: s.refill,
    quality: s.quality,
    instant: s.instant,
    desc: s.desc,
  }));

  return NextResponse.json({
    ok: data.ok,
    source: data.source,
    rate: data.rate,
    updatedAt: data.updatedAt,
    totalPlatforms: data.totalPlatforms,
    totalServices: data.totalServices,
    platforms: data.platforms,
    services,
    pricing: data.pricing,
    cached: fromCache,
    isStale,
  });
}
