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

type OverrideRow = {
  plan_id: number;
  network: string;
  override_price: number | null;
  label: string | null;
  featured: boolean | null;
  visible: boolean | null;
};

async function loadOverrides(): Promise<Map<string, OverrideRow>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const map = new Map<string, OverrideRow>();
  if (!url || !serviceKey) return map;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/data_price_overrides?select=*`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    });
    if (res.ok) {
      for (const r of (await res.json()) as OverrideRow[]) {
        map.set(`${r.plan_id}:${r.network}`, r);
      }
    }
  } catch {
    /* fall back to Verxor pricing */
  }
  return map;
}

/**
 * GET /api/data/plans -> Verxor panel API (child pricing).
 * Returns plans grouped by network for the data page UI.
 * Customer price = admin override_price when set, else Verxor retail (face).
 * Overrides with visible=false are removed from the store.
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
    const overrides = await loadOverrides();
    const visible = plans
      .map((p) => {
        const o = overrides.get(`${p.id}:${p.network}`);
        if (o?.visible === false) return null;
        const custom = Number(o?.override_price);
        const hasCustom = o?.override_price != null && Number.isFinite(custom) && custom > 0;
        return {
          ...p,
          name: o?.label || p.name,
          price: hasCustom ? Math.round(custom * 100) / 100 : p.retail,
          featured: Boolean(o?.featured),
          hasCustomPrice: hasCustom,
        };
      })
      .filter((p): p is VerxorPlan => Boolean(p));
    return NextResponse.json({ ok: true, plans: visible });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not load data plans." },
      { status: 502 },
    );
  }
}
