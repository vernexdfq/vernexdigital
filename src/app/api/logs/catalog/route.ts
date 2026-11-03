import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { logsWholesaleNgn, logsRetailNgn } from "@/lib/logs-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/logs/catalog?platform=Facebook[&refresh=1]
 * Proxies the Verxor parent accounts catalogue (43 platforms) and applies the
 * panel's two-layer pricing. Provider descriptions are passed through verbatim.
 * Only the customer retail price is exposed to the browser.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const platform = (searchParams.get("platform") || "").trim();
  const refresh = searchParams.get("refresh") === "1";
  if (!platform) {
    return NextResponse.json({ ok: false, error: "Choose a platform first." }, { status: 400 });
  }
  if (!verxorConfig().configured) {
    return NextResponse.json({ ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." }, { status: 503 });
  }
  try {
    const qs = new URLSearchParams({ platform });
    if (refresh) qs.set("refresh", "1");
    const res = await verxorFetch(`/accounts/catalog?${qs.toString()}`, { method: "GET" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return NextResponse.json(
        { ok: false, error: String(data.error || "Could not load the live catalogue. Try again shortly.") },
        { status: 502 },
      );
    }
    const offers = (Array.isArray(data.offers) ? data.offers : [])
      .map((o: Record<string, unknown>) => {
        const parentUnit = Math.round(Number(o.priceNgn) || 0);
        const wholesale = logsWholesaleNgn(parentUnit);
        const retail = logsRetailNgn(wholesale);
        return {
          providerListingId: Number(o.providerListingId) || 0,
          platform: String(o.platform || platform),
          subtype: String(o.subtype || ""),
          subtypeId: Number(o.subtypeId) || null,
          title: String(o.title || "Accounts"),
          description: String(o.description || ""),
          stock: Number(o.stock) || 0,
          maxQuantity: Math.min(10, Number(o.stock) || 0),
          wholesaleNgn: wholesale,
          priceNgn: retail,
        };
      })
      .filter((o) => o.providerListingId > 0 && o.stock > 0 && o.priceNgn > 0);
    const subtypes = (Array.isArray(data.subtypes) ? data.subtypes : [])
      .map((s: Record<string, unknown>) => ({
        id: Number(s.id) || 0,
        name: String(s.name || ""),
        count: Number(s.count) || 0,
        stock: Number(s.stock) || 0,
      }))
      .filter((s) => s.id > 0 && s.name);

    return NextResponse.json({
      ok: true,
      platform,
      subtypes,
      offers,
      updatedAt: data.updatedAt || null,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach Verxor. Check your connection and try again." }, { status: 502 });
  }
}
