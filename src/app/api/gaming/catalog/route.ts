import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { gamingCustomerPrice, getSharedGamingPricing } from "@/lib/gaming-panel-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CachedGame = { id: string; name: string; fromNgn: number | null; image?: string | null };
type ServerCatalogCache = {
  timestamp: number;
  games: CachedGame[];
  count: number;
};

// In-memory cache on the child panel server (15m TTL) to deliver instant responses
let serverCatalogCache: ServerCatalogCache | null = null;
const CATALOG_CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * GET /api/gaming/catalog?all=1 — full game list ("from" prices) from Verxor,
 * re-priced for panel customers with the panel's own multipliers.
 * Caches in server memory for instant responses and falls back gracefully.
 */
export async function GET(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured" },
      { status: 503 },
    );
  }

  // 1) Fast in-memory cache hit (< 1ms)
  if (
    serverCatalogCache &&
    Date.now() - serverCatalogCache.timestamp < CATALOG_CACHE_TTL_MS &&
    serverCatalogCache.games.length > 0
  ) {
    return NextResponse.json(
      { ok: true, games: serverCatalogCache.games, count: serverCatalogCache.count, cached: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      },
    );
  }

  try {
    const res = await verxorFetch("/gaming/catalog?all=1");
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      games?: Array<{ id: string; name: string; fromNgn: number | null; image?: string | null }>;
    };

    if (!res.ok || data.ok === false || !Array.isArray(data.games)) {
      // If upstream failed but we have a stale cache, serve it rather than breaking the page
      if (serverCatalogCache && serverCatalogCache.games.length > 0) {
        return NextResponse.json(
          { ok: true, games: serverCatalogCache.games, count: serverCatalogCache.count, stale: true },
          {
            headers: {
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
            },
          },
        );
      }
      return NextResponse.json(
        { ok: false, error: data.error || "Gaming catalog unavailable right now." },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    const { markups } = await getSharedGamingPricing();
    const games = data.games.map((g) => ({
      id: g.id,
      name: g.name,
      image: g.image || null,
      fromNgn: g.fromNgn && g.fromNgn > 0 ? gamingCustomerPrice(g.fromNgn, markups) : null,
    }));

    serverCatalogCache = {
      timestamp: Date.now(),
      games,
      count: games.length,
    };

    return NextResponse.json(
      { ok: true, games, count: games.length },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      },
    );
  } catch (e) {
    if (serverCatalogCache && serverCatalogCache.games.length > 0) {
      return NextResponse.json(
        { ok: true, games: serverCatalogCache.games, count: serverCatalogCache.count, stale: true },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
          },
        },
      );
    }
    const message = e instanceof Error ? e.message : "Catalog error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
