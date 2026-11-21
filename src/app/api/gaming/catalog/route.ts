import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { gamingCustomerPrice, getSharedGamingPricing } from "@/lib/gaming-panel-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/gaming/catalog?all=1 — full game list ("from" prices) from Verxor,
 * re-priced for panel customers with the panel's own multipliers.
 * Verxor returns child-panel prices (the panel key is attached), and we mark
 * those up: customer price = child price × tier multiplier.
 */
export async function GET(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured" },
      { status: 503 },
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
    return NextResponse.json({ ok: true, games, count: games.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Catalog error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
