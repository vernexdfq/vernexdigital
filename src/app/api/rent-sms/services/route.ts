import { NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/rent-sms/services — the live Textverified service list via Verxor.
 * Same shape as the parent endpoint so the rental page contract is identical.
 */
export async function GET() {
  if (!verxorConfig().configured) {
    return NextResponse.json({ ok: false, error: "Rent-for-SMS is not configured on this panel yet." }, { status: 503 });
  }
  try {
    const res = await verxorFetch("/rent-sms/services", { method: "GET" });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; services?: string[]; error?: string };
    if (res.ok && data.ok && Array.isArray(data.services)) {
      return NextResponse.json({ ok: true, services: data.services });
    }
    return NextResponse.json({ ok: false, error: data.error || "Could not load the service list right now." }, { status: 503 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load the service list right now." }, { status: 502 });
  }
}
