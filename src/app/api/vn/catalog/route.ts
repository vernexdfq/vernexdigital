import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import {
  API_MULT,
  UI_POOL_TO_VERXOR,
  SERVICE_NAME_TO_CODE,
  panelWholesaleNgn,
  endUserPriceNgn,
  type PoolTier,
} from "@/lib/verxor-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy Verxor catalog and re-price with panel API multipliers (NGN).
 * Query: mode=services|prices|countries|pools
 *        pool=usa-s1|…  service=wa|WhatsApp  country=US
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get("mode") || "services").toLowerCase();
  const uiPool = searchParams.get("pool") || "";
  const serviceRaw = (searchParams.get("service") || "").trim();
  const country = (searchParams.get("country") || "").trim();

  const map = uiPool ? UI_POOL_TO_VERXOR[uiPool] : null;
  const verxorPool = map?.verxorPool || uiPool;
  const tier: PoolTier = map?.tier || "economy";
  const serviceCode =
    SERVICE_NAME_TO_CODE[serviceRaw] || serviceRaw.toLowerCase() || "";

  const markup = Number(process.env.PANEL_MARKUP_PERCENT) || 15;
  const { configured } = verxorConfig();

  if (!configured) {
    if (mode === "services") {
      return NextResponse.json({
        ok: true,
        mode: "services",
        live: false,
        message: "Set VERXOR_PANEL_API_KEY to load live catalog",
        services: Object.entries(SERVICE_NAME_TO_CODE).map(([name, code]) => ({
          code,
          name,
          display_name: name,
        })),
      });
    }
    if (mode === "prices") {
      const demoCost = { economy: 800, standard: 1400, fast: 2200, premium: 4000 }[tier];
      const wholesale = panelWholesaleNgn({ costNgn: demoCost, tier });
      const retail = endUserPriceNgn(wholesale, markup);
      return NextResponse.json({
        ok: true,
        mode: "prices",
        live: false,
        tier,
        pool: uiPool,
        options: [
          {
            label: "Route 1",
            costNgn: demoCost,
            wholesaleNgn: wholesale,
            priceNgn: retail,
            stock: 99,
          },
        ],
      });
    }
    return NextResponse.json({
      ok: false,
      error: "VERXOR_PANEL_API_KEY not configured",
    }, { status: 503 });
  }

  try {
    const qs = new URLSearchParams({ mode });
    if (verxorPool) qs.set("pool", verxorPool);
    if (serviceCode) qs.set("service", serviceCode);
    if (country) qs.set("country", country);

    const res = await verxorFetch(`/catalog?${qs.toString()}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        { ok: false, error: data.reason || data.error || "Catalog failed", upstream: data },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    if (mode === "prices" && Array.isArray(data.options)) {
      const options = data.options.map(
        (
          o: {
            priceUsd?: number;
            fromUsd?: number;
            priceNgn?: number;
            stock?: number;
            label?: string;
            grizzlyCountry?: string;
          },
          i: number,
        ) => {
          const costUsd = o.priceUsd ?? o.fromUsd ?? null;
          const wholesale = panelWholesaleNgn({
            costUsd: costUsd != null ? Number(costUsd) : null,
            costNgn:
              costUsd == null && o.priceNgn
                ? Number(o.priceNgn) / (API_MULT[tier] || 2)
                : null,
            tier,
          });
          const retail = endUserPriceNgn(wholesale || Number(o.priceNgn) || 0, markup);
          return {
            label: o.label || `Route ${i + 1}`,
            costUsd: costUsd != null ? Number(costUsd) : null,
            wholesaleNgn: wholesale,
            priceNgn: retail,
            stock: Number(o.stock) || 0,
            grizzlyCountry: o.grizzlyCountry || country || "",
            tier,
            multiplier: API_MULT[tier],
          };
        },
      );
      return NextResponse.json({
        ok: true,
        mode: "prices",
        live: true,
        tier,
        pool: uiPool,
        verxorPool,
        service: data.service,
        country: data.country || country || null,
        count: options.length,
        options,
        pricing: {
          note: "wholesaleNgn = cost × API mult (panel pays Verxor); priceNgn = wholesale × panel markup (end user)",
          apiMult: API_MULT[tier],
          markupPercent: markup,
        },
      });
    }

    return NextResponse.json({ ...data, live: true, tier, verxorPool });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Catalog error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
