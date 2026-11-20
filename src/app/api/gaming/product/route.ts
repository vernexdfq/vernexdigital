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

/**
 * GET /api/gaming/product?product_id=… — buy-sheet detail from Verxor with
 * panel pricing applied. Accepts raw game ids, `game-<id>` and `s2t-…` ids,
 * exactly like the Verxor endpoint.
 */
export async function GET(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured" },
      { status: 503 },
    );
  }
  const productId = (req.nextUrl.searchParams.get("product_id") || "").trim();
  if (!productId) {
    return NextResponse.json({ ok: false, error: "Missing product id" }, { status: 400 });
  }
  try {
    const res = await verxorFetch(
      `/gaming/product?product_id=${encodeURIComponent(productId)}`,
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      product?: UpstreamProduct;
    };
    if (!res.ok || data.ok === false || !data.product) {
      return NextResponse.json(
        { ok: false, error: data.error || "Product unavailable right now." },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }
    const { markups } = await getSharedGamingPricing();
    const p = data.product;
    return NextResponse.json({
      ok: true,
      product: {
        id: p.id,
        name: p.name,
        image: p.image || null,
        fields: p.fields || [],
        servers: p.servers || [],
        variations: (p.variations || []).map((v) => ({
          id: v.id,
          name: v.name,
          priceNgn:
            v.priceNgn && v.priceNgn > 0 ? gamingCustomerPrice(v.priceNgn, markups) : 0,
          inStock: v.inStock !== false,
        })),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Product error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
