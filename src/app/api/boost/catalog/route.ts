import { NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { panelRetailRatePer1000, partnerRatePer1000 } from "@/lib/boost-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live SMM catalog from Verxor.
 * Re-prices each service with partner mults + panel markup (default +25%).
 */
export async function GET() {
  const { configured, base } = verxorConfig();

  try {
    let res: Response;
    if (configured) {
      res = await verxorFetch("/boost/catalog");
    } else {
      res = await fetch(`${base}/boost/catalog`, { cache: "no-store" });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        { ok: false, error: data.error || "Catalog unavailable" },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    const services = Array.isArray(data.services)
      ? data.services.map((s: Record<string, unknown>) => {
          const wholesaleUsd = Number(s.wholesaleUsd) || 0;
          const ratePer1000 = panelRetailRatePer1000(wholesaleUsd);
          const partnerRate = partnerRatePer1000(wholesaleUsd);
          return {
            id: String(s.id ?? s.providerId ?? ""),
            providerId: Number(s.providerId) || Number(s.id) || 0,
            platform: String(s.platform || ""),
            platformName: String(s.platformName || s.platform || ""),
            category: String(s.category || ""),
            categoryName: String(s.categoryName || s.category || ""),
            title: String(s.title || s.name || ""),
            name: String(s.title || s.name || ""),
            group: String(s.categoryName || s.category || "Services"),
            categoryId: String(s.platform || ""),
            ratePer1000,
            partnerRatePer1000: partnerRate,
            wholesaleUsd,
            min: Number(s.min) || 1,
            max: Number(s.max) || 1000000,
            speed: String(s.speed || ""),
            refill: s.refill,
            instant: s.instant,
          };
        })
      : [];

    const platforms = Array.isArray(data.platforms)
      ? data.platforms.map((p: Record<string, unknown>) => ({
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
          categories: p.categories || [],
          totalServices: Number(p.totalServices) || 0,
        }))
      : [];

    return NextResponse.json({
      ok: true,
      source: data.source || "live",
      rate: data.rate || 1380,
      updatedAt: data.updatedAt,
      totalPlatforms: platforms.length,
      totalServices: services.length,
      platforms,
      services,
      pricing: {
        mode: "partner_plus_markup",
        markup: Number(process.env.BOOST_PANEL_MARKUP ?? "0.25"),
        note: "Panel pays Verxor partner rate; end users pay partner × (1+markup)",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Catalog failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
