import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import {
  WHOLESALE_MULT,
  RETAIL_MULT,
  UI_POOL_TO_VERXOR,
  SERVICE_NAME_TO_CODE,
  panelWholesaleNgn,
  endUserPriceNgn,
  quoteFromProviderUsd,
  type PoolTier,
} from "@/lib/verxor-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy Verxor catalog; re-price with two layers:
 *  - wholesaleNgn = provider_usd × 1380 × Verxor mult (1.5 / 1.3 / 1.2 / 1.15)
 *  - priceNgn     = wholesale × panel retail mult (3 / 2.5 / 2 / 1.5)  [default]
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

  const { configured } = verxorConfig();

  if (!configured) {
    if (mode === "services") {
      return NextResponse.json({
        ok: true,
        mode: "services",
        live: false,
        message: "Set VERXOR_PANEL_API_KEY to load live Grizzly catalog",
        services: Object.entries(SERVICE_NAME_TO_CODE).map(([name, code]) => ({
          code,
          name,
          display_name: name,
        })),
      });
    }
    if (mode === "prices") {
      const demoUsd =
        { economy: 0.4, standard: 0.75, fast: 1.5, premium: 2.5 }[tier] ?? 0.4;
      const q = quoteFromProviderUsd(demoUsd, tier);
      return NextResponse.json({
        ok: true,
        mode: "prices",
        live: false,
        tier,
        pool: uiPool,
        options: [
          {
            label: "Route 1",
            costUsd: demoUsd,
            wholesaleNgn: q.wholesaleNgn,
            priceNgn: q.priceNgn,
            wholesaleMult: q.wholesaleMult,
            retailMult: q.retailMult,
            stock: 99,
          },
        ],
      });
    }
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured" },
      { status: 503 },
    );
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
        {
          ok: false,
          error: data.reason || data.error || "Catalog failed",
          upstream: data,
        },
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
          const costUsdRaw = o.priceUsd ?? o.fromUsd ?? null;
          const costUsd = costUsdRaw != null ? Number(costUsdRaw) : null;

          let wholesale: number;
          let retail: number;
          let wholesaleMult = WHOLESALE_MULT[tier];
          let retailMult = RETAIL_MULT[tier];

          if (costUsd != null && costUsd > 0) {
            const q = quoteFromProviderUsd(costUsd, tier);
            wholesale = q.wholesaleNgn;
            retail = q.priceNgn;
            wholesaleMult = q.wholesaleMult;
            retailMult = q.retailMult;
          } else {
            wholesale = panelWholesaleNgn({
              costNgn: o.priceNgn
                ? Number(o.priceNgn) / (WHOLESALE_MULT[tier] || 1.5)
                : null,
              tier,
            });
            retail = endUserPriceNgn(wholesale);
          }

          return {
            label: o.label || `Route ${i + 1}`,
            costUsd,
            wholesaleNgn: wholesale,
            priceNgn: retail,
            stock: Number(o.stock) || 0,
            grizzlyCountry: o.grizzlyCountry || country || "",
            tier,
            wholesaleMult,
            retailMult,
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
          note: "wholesaleNgn = usd×1380×Verxor(1.5/1.3/1.2/1.15); priceNgn = wholesale×panel(3/2.5/2/1.5)",
          wholesaleMult: WHOLESALE_MULT[tier],
          retailMult: RETAIL_MULT[tier],
        },
      });
    }

    return NextResponse.json({ ...data, live: true, tier, verxorPool });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Catalog error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
