import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PROVIDERS = new Set(["dstv", "gotv", "startimes"]);

/**
 * POST /api/cable-tv/verify
 * Proxies smartcard verification to Verxor → ClubKonnect.
 */
export async function POST(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." },
      { status: 503 },
    );
  }

  let body: { provider?: string; smartCardNo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const provider = String(body.provider || "").toLowerCase().trim();
  if (!PROVIDERS.has(provider)) {
    return NextResponse.json(
      { ok: false, error: "Invalid TV provider. Use DStv, GOtv or StarTimes." },
      { status: 400 },
    );
  }

  const smartCardNo = String(body.smartCardNo || "").replace(/\D/g, "");
  if (smartCardNo.length < 8 || smartCardNo.length > 15) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid smartcard / IUC number" },
      { status: 400 },
    );
  }

  try {
    const res = await verxorFetch("/tv", {
      method: "POST",
      body: JSON.stringify({
        action: "verify",
        provider,
        smartCardNo,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        { ok: false, error: String(data.error || "Smartcard verification failed") },
        { status: res.status >= 400 && res.status < 600 ? res.status : 400 },
      );
    }
    return NextResponse.json({
      ok: true,
      customerName: data.customerName,
      provider: data.provider || provider,
      smartCardNo: data.smartCardNo || smartCardNo,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Verification failed" },
      { status: 502 },
    );
  }
}
