import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { rentSmsCustomerNgn, rentSmsMultiplierFor } from "@/lib/rentsms-pricing";
import { getSharedRentSmsPricing } from "@/lib/rentsms-pricing-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/rent-sms/quote
 *   { serviceName, duration, areaCode } → { ok, priceNgn, durationLabel, serviceName }
 *
 * Asks Verxor for the live price with the panel key. The parent returns our
 * panel-tier wholesale charge (`priceNgn`), the Verxor retail price
 * (`retailPriceNgn`) and the cost tier (1–5). Our customer pays:
 *
 *     customer = our wholesale charge × our tier multiplier
 *
 * The default multipliers are Verxor retail ÷ Verxor panel per tier, so with
 * nothing saved we sell at the same price as verxor.com. Rounded up to ₦50.
 */
export async function POST(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json({ ok: false, error: "Rent-for-SMS is not configured on this panel yet." }, { status: 503 });
  }
  const body = (await req.json().catch(() => ({}))) as { serviceName?: string; duration?: string; areaCode?: boolean };
  const serviceName = String(body.serviceName || "").trim();
  const duration = String(body.duration || "").trim();
  const areaCode = Boolean(body.areaCode);
  if (!serviceName || !duration) {
    return NextResponse.json({ ok: false, error: "Missing service or duration." }, { status: 400 });
  }
  try {
    const upstream = await verxorFetch("/rent-sms/quote", {
      method: "POST",
      body: JSON.stringify({ serviceName, duration, areaCode }),
    });
    const data = (await upstream.json().catch(() => ({}))) as {
      ok?: boolean;
      priceNgn?: number;
      retailPriceNgn?: number;
      tier?: number;
      durationLabel?: string;
      error?: string;
    };
    if (!upstream.ok || !data.ok || !Number(data.priceNgn)) {
      return NextResponse.json(
        { ok: false, error: data.error || "No price available for that option right now." },
        { status: upstream.ok ? 404 : 502 },
      );
    }
    const wholesaleNgn = Math.round(Number(data.priceNgn) || 0);
    const tier = Math.min(Math.max(Number(data.tier) || 1, 1), 5);
    const { multipliers } = await getSharedRentSmsPricing();
    const multiplier = rentSmsMultiplierFor(tier, multipliers);
    const customerPriceNgn = rentSmsCustomerNgn(wholesaleNgn, multiplier);
    if (!customerPriceNgn || customerPriceNgn <= 0) {
      return NextResponse.json({ ok: false, error: "Could not compute the price. Try again." }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      priceNgn: customerPriceNgn,
      wholesalePriceNgn: wholesaleNgn,
      verxorRetailPriceNgn: Math.round(Number(data.retailPriceNgn) || 0),
      tier,
      multiplier,
      durationLabel: data.durationLabel || duration,
      serviceName,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach the pricing service. Try again." }, { status: 502 });
  }
}
