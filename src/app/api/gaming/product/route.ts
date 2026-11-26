import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { gamingCustomerPrice, getSharedGamingPricing } from "@/lib/gaming-panel-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UpstreamProduct = {
  id: string;
  name: string;
  image?: string | null;
  fields?: Array<{ field: string; label?: string }>;
  variations?: Array<{ id: string; name: string; priceNgn: number; inStock: boolean }>;
  servers?: Array<{ id: string; name: string }>;
};

type ServerProductCache = {
  timestamp: number;
  product: any;
};

// In-memory product detail cache (15m TTL) on the panel server
const serverProductCache = new Map<string, ServerProductCache>();
const PRODUCT_CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * GET /api/gaming/product?product_id=… — buy-sheet detail from Verxor with
 * panel pricing applied. Instant memory hits and graceful fallback.
 */
export async function GET(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured" },
      { status: 503 },
    );
  }
  const productId = (req.nextUrl.searchParams.get("product_id") || "").trim();
  const fallbackImage = (req.nextUrl.searchParams.get("image") || "").trim() || null;
  if (!productId) {
    return NextResponse.json({ ok: false, error: "Missing product id" }, { status: 400 });
  }

  const cacheKey = `${productId}:${fallbackImage || ""}`;
  const memCached = serverProductCache.get(cacheKey);
  if (memCached && Date.now() - memCached.timestamp < PRODUCT_CACHE_TTL_MS) {
    return NextResponse.json(
      { ok: true, product: memCached.product, cached: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      },
    );
  }

  try {
    const upstreamUrl = `/gaming/product?product_id=${encodeURIComponent(productId)}${
      fallbackImage ? `&image=${encodeURIComponent(fallbackImage)}` : ""
    }`;
    const res = await verxorFetch(upstreamUrl);
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      product?: UpstreamProduct;
    };
    if (!res.ok || data.ok === false || !data.product) {
      if (memCached && memCached.product) {
        return NextResponse.json(
          { ok: true, product: memCached.product, stale: true },
          {
            headers: {
              "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
            },
          },
        );
      }
      return NextResponse.json(
        { ok: false, error: data.error || "Product unavailable right now." },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }
    const { markups } = await getSharedGamingPricing();
    const p = data.product;
    const finalProduct = {
      id: p.id,
      name: p.name,
      image: p.image || fallbackImage || null,
      fields: p.fields || [],
      servers: p.servers || [],
      variations: (p.variations || []).map((v) => ({
        id: v.id,
        name: v.name,
        priceNgn:
          v.priceNgn && v.priceNgn > 0 ? gamingCustomerPrice(v.priceNgn, markups) : 0,
        inStock: v.inStock !== false,
      })),
    };

    serverProductCache.set(cacheKey, {
      timestamp: Date.now(),
      product: finalProduct,
    });

    return NextResponse.json(
      {
        ok: true,
        product: finalProduct,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        },
      },
    );
  } catch (e) {
    if (memCached && memCached.product) {
      return NextResponse.json(
        { ok: true, product: memCached.product, stale: true },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
          },
        },
      );
    }
    const message = e instanceof Error ? e.message : "Product error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
