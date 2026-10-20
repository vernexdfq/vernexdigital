import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  try {
    const { configured } = verxorConfig();
    if (!configured) {
      return NextResponse.json({ error: "VERXOR_PANEL_API_KEY not set" }, { status: 503 });
    }
    const res = await verxorFetch("/partner/fund/reset-balance", { method: "POST", body: "{}" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        { error: data.message || data.error || "Reset failed" },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }
    return NextResponse.json({ ok: true, balance: 0, message: data.message });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
