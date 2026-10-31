import { NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { panelRetailRatePer1000, partnerRatePer1000 } from "@/lib/boost-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live SMM catalog from Verxor.
 * Pulls all platforms, categories, and services.
 * Re-prices each service with partner multipliers + panel markup (default +25%).
 */
export async function GET(req: Request) {
  const { configured, base } = verxorConfig();
  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "1" || searchParams.get("refresh") === "true";
  const path = `/boost/catalog${forceRefresh ? "?refresh=1" : ""}`;

  try {
    let res: Response;
    if (configured) {
      res = await verxorFetch(path);
    } else {
      res = await fetch(`${base}${path}`, { cache: "no-store" });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        { ok: false, error: data.error || "Services catalog temporarily unavailable" },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    const services = Array.isArray(data.services)
      ? data.services.map((s: Record<string, unknown>) => {
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
            refill: s.refill,
            quality: s.quality,
            instant: s.instant,
            desc: s.desc ? String(s.desc) : undefined,
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
          urlPatternStr: String(p.urlPatternStr || "https?:\\/\\/"),
          categories: Array.isArray(p.categories) ? p.categories : [],
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Catalog error";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
