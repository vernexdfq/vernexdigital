import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VerxorPlan = {
  id: number;
  name: string;
  price: number; // child price when called with the panel key
  days: string;
  planType: string;
  validityCategory: string;
  network: string;
  size: string;
  retail: number;
  childPrice: number;
  tab: string;
};

/**
 * GET /api/data/plans -> Verxor panel API (child pricing).
 * Returns plans grouped by network for the data page UI.
 */
export async function GET(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json(
      { ok: false, error: "Data is not configured on this panel yet." },
      { status: 503 },
    );
  }
  const network = req.nextUrl.searchParams.get("network")?.toLowerCase() || "";
  try {
    const res = await verxorFetch(
      network ? `/data/plans?network=${encodeURIComponent(network)}` : "/data/plans",
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      plans?: VerxorPlan[];
      networks?: Record<string, VerxorPlan[]>;
    };
    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        { ok: false, error: String(data.error || "Could not load data plans.") },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
      );
    }
    const plans: VerxorPlan[] = network
      ? data.plans || []
      : Object.values(data.networks || {}).flat();
    return NextResponse.json({ ok: true, plans });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not load data plans." },
      { status: 502 },
    );
  }
}
