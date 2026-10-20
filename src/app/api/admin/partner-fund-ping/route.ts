import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { configured } = verxorConfig();
    if (!configured) {
      return NextResponse.json({ error: "VERXOR_PANEL_API_KEY not set" }, { status: 503 });
    }
    const body = await req.json().catch(() => ({}));
    const res = await verxorFetch("/partner/fund/ping", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => "");
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        raw: text.slice(0, 300),
        html502: text.includes("502") || text.includes("<!DOCTYPE"),
      };
    }
    return NextResponse.json(
      { httpStatus: res.status, ...data },
      { status: res.ok ? 200 : res.status >= 400 ? res.status : 502 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ping failed" },
      { status: 500 },
    );
  }
}
