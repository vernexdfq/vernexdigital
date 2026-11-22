import { NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/rent-sms/area-codes — the live US area-code list via Verxor
 * (grouped by state on the frontend, everything from the provider).
 */
export async function GET() {
  if (!verxorConfig().configured) {
    return NextResponse.json({ ok: false, error: "Rent-for-SMS is not configured on this panel yet." }, { status: 503 });
  }
  try {
    const res = await verxorFetch("/rent-sms/area-codes", { method: "GET" });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      areaCodes?: { code: string; place: string }[];
      error?: string;
    };
    if (res.ok && data.ok && Array.isArray(data.areaCodes)) {
      return NextResponse.json({ ok: true, areaCodes: data.areaCodes });
    }
    return NextResponse.json({ ok: false, error: data.error || "Could not load the area-code list right now." }, { status: 503 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load the area-code list right now." }, { status: 502 });
  }
}
