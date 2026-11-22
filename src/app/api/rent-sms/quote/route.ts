import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { rentSmsCustomerNgn } from "@/lib/rentsms-pricing";
import { getSharedRentSmsPricing } from "@/lib/rentsms-pricing-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/rent-sms/quote
 *   { serviceName, duration, areaCode } → { ok, priceNgn, durationLabel, serviceName }
 *
 * Asks Verxor for the live price with the panel key. The parent returns its
 * panel-tier wholesale charge (`priceNgn`) and Verxor retail
 * (`retailPriceNgn`). Our customer pays Verxor retail × the admin multiplier
 * (default 1.0 — same price as verxor.com), rounded up to the nearest ₦50.
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
      durationLabel?: string;
      error?: string;
    };
    if (!upstream.ok || !data.ok || !Number(data.retailPriceNgn)) {
      return NextResponse.json(
        { ok: false, error: data.error || "No price available for that option right now." },
        { status: upstream.ok ? 404 : 502 },
      );
    }
    const { multiplier } = await getSharedRentSmsPricing();
    const customerPriceNgn = rentSmsCustomerNgn(Number(data.retailPriceNgn), multiplier);
    if (!customerPriceNgn || customerPriceNgn <= 0) {
      return NextResponse.json({ ok: false, error: "Could not compute the price. Try again." }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      priceNgn: customerPriceNgn,
      wholesalePriceNgn: Math.round(Number(data.priceNgn) || 0),
      verxorRetailPriceNgn: Math.round(Number(data.retailPriceNgn) || 0),
      durationLabel: data.durationLabel || duration,
      serviceName,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach the pricing service. Try again." }, { status: 502 });
  }
}
