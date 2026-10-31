import { NextResponse } from "next/server";
import { getAuthoritativeCatalog } from "@/lib/boost-catalog-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live SMM catalog with server-side caching and stale fallback handling.
 * - Caches Verxor catalog for 5 minutes in server memory.
 * - Allows ?refresh=1 to bypass cache.
 * - Falls back to safe cached catalog if Verxor is momentarily down, marking source: "stale_fallback".
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
      { status: 503 }
    );
  }

  return NextResponse.json({
    ...data,
    cached: fromCache,
    isStale,
  });
}
