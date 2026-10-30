import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { configured, base } = verxorConfig();
  const orderId = req.nextUrl.searchParams.get("orderId") || req.nextUrl.searchParams.get("id");
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "orderId required" }, { status: 400 });
  }
  try {
    let res: Response;
    if (configured) {
      res = await verxorFetch(`/boost/status?orderId=${encodeURIComponent(orderId)}`);
    } else {
      res = await fetch(`${base}/boost/status?orderId=${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Status failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
