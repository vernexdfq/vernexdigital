import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cashback
 *
 * Unclaimed cashback the panel has earned from completed bill orders:
 *   cashback = what the customer paid (face value)
 *            - what Verxor charged the panel (meta.panelCharge).
 *
 * Aggregated per service kind. Any future service that logs
 * `panelCharge` on its completed transactions appears automatically.
 * Orders already moved to the wallet (meta.cashbackClaimedAt) are excluded.
 */

const SERVICE_LABELS: Record<string, string> = {
  airtime: "Airtime & data",
  electricity: "Electricity",
  cable_tv: "TV subscription",
  data: "Data bundles",
  gift_card: "Gift cards",
};

const SERVICE_ORDER = ["airtime", "electricity", "cable_tv"];

export async function GET(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!url || !anon) {
      return NextResponse.json(
        { ok: false, error: "Supabase not configured" },
        { status: 503 },
      );
    }
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Sign in as admin." },
        { status: 401 },
      );
    }

    const client = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data } = await client.auth.getUser();
    if (!data.user) {
      return NextResponse.json(
        { ok: false, error: "Sign in as admin." },
        { status: 401 },
      );
    }

    const admin = createServerClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profile?.is_admin) {
      return NextResponse.json({ ok: false, error: "Admins only." }, { status: 403 });
    }

    const { data: txns, error } = await admin
      .from("transactions")
      .select("kind, amount, status, meta")
      .in("status", ["completed", "success"])
      .order("created_at", { ascending: false })
      .limit(20000);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const groups = new Map<string, { orders: number; volume: number; cashback: number }>();
    for (const t of (txns ?? []) as Array<Record<string, unknown>>) {
      const kind = String(t.kind || "other");
      const meta = (t.meta && typeof t.meta === "object" ? t.meta : {}) as Record<string, unknown>;
      // Skip cashback that has already been moved to the panel wallet
      if (meta.cashbackClaimedAt) continue;
      const panelCharge = Number(meta.panelCharge);
      // Skip orders without a recorded wholesale charge (older records)
      if (!Number.isFinite(panelCharge) || panelCharge <= 0) continue;
      const face = Math.abs(Number(t.amount) || 0);
      if (face <= 0) continue;

      const cash = Math.max(0, Math.round((face - panelCharge) * 100) / 100);
      const g = groups.get(kind) ?? { orders: 0, volume: 0, cashback: 0 };
      g.orders += 1;
      g.volume += face;
      g.cashback += cash;
      groups.set(kind, g);
    }

    const kinds = [...groups.keys()].sort((a, b) => {
      const ia = SERVICE_ORDER.indexOf(a);
      const ib = SERVICE_ORDER.indexOf(b);
      if (ia !== -1 || ib !== -1) {
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      }
      return (groups.get(b)?.cashback ?? 0) - (groups.get(a)?.cashback ?? 0);
    });

    let totalCashback = 0;
    let totalOrders = 0;
    const services = kinds.map((kind) => {
      const g = groups.get(kind)!;
      totalCashback += g.cashback;
      totalOrders += g.orders;
      return {
        kind,
        label: SERVICE_LABELS[kind] || kind.replace(/_/g, " "),
        orders: g.orders,
        volume: Math.round(g.volume * 100) / 100,
        cashback: Math.round(g.cashback * 100) / 100,
      };
    });

    return NextResponse.json({
      ok: true,
      services,
      totalCashback: Math.round(totalCashback * 100) / 100,
      totalOrders,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not load cashback." },
      { status: 500 },
    );
  }
}
