import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Map panel disco ids → Verxor / ClubKonnect slugs */
const DISCO_MAP: Record<string, string> = {
  ikeja: "ikeja",
  eko: "eko",
  ibadan: "ibadan",
  abuja: "abuja",
  kaduna: "kaduna",
  kano: "kano",
  jos: "jos",
  phed: "ph",
  ph: "ph",
  enugu: "enugu",
  benin: "benin",
  yola: "yola",
  aba: "aba",
};

/**
 * POST /api/electricity/verify
 * Proxies meter verification to Verxor → ClubKonnect.
 */
export async function POST(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." },
      { status: 503 },
    );
  }

  let body: { disco?: string; meterType?: string; meterNo?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const discoRaw = String(body.disco || "").toLowerCase().trim();
  const disco = DISCO_MAP[discoRaw];
  if (!disco) {
    return NextResponse.json({ ok: false, error: "Invalid electricity company" }, { status: 400 });
  }

  const meterTypeRaw = String(body.meterType || "prepaid").toLowerCase();
  const meterType = meterTypeRaw === "postpaid" ? "postpaid" : "prepaid";
  const meterNo = String(body.meterNo || "").replace(/\D/g, "");
  if (meterNo.length < 8 || meterNo.length > 15) {
    return NextResponse.json({ ok: false, error: "Enter a valid meter number" }, { status: 400 });
  }

  try {
    const res = await verxorFetch("/electricity", {
      method: "POST",
      body: JSON.stringify({
        action: "verify",
        disco,
        meterType,
        meterNo,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        { ok: false, error: String(data.error || "Meter verification failed") },
        { status: res.status >= 400 && res.status < 600 ? res.status : 400 },
      );
    }
    return NextResponse.json({
      ok: true,
      customerName: data.customerName,
      disco: data.disco || disco,
      meterType: data.meterType || meterType,
      meterNo: data.meterNo || meterNo,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Verification failed" },
      { status: 502 },
    );
  }
}
