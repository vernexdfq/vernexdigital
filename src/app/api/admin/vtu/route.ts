import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/vtu
 *
 * VTU cashback breakdown for the admin VTU services page.
 * Cashback is applied by Verxor at checkout (customers pay face value);
 * the effective rate per service/network is derived from completed orders:
 *   rate % = (customer paid − Verxor panel charge) / customer paid
 */

const NETWORKS = [
  { id: "mtn", label: "MTN" },
  { id: "glo", label: "GLO" },
  { id: "airtel", label: "Airtel" },
  { id: "9mobile", label: "9mobile" },
];

type Group = { orders: number; volume: number; cashback: number };
const emptyGroup = (): Group => ({ orders: 0, volume: 0, cashback: 0 });

function finalize(g: Group) {
  const ratePct = g.volume > 0 ? Math.round((g.cashback / g.volume) * 10000) / 100 : null;
  return {
    orders: g.orders,
    volume: Math.round(g.volume * 100) / 100,
    cashback: Math.round(g.cashback * 100) / 100,
    ratePct,
  };
}

async function isAdmin(req: NextRequest) {
  const partner = req.cookies.get(PARTNER_ADMIN_COOKIE)?.value;
  if (partner && verifyPartnerAdminToken(partner).ok) return true;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return false;
  const auth = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await auth.auth.getUser();
  if (!data.user) return false;
  const db = createServerClient();
  const { data: profile } = await db.from("profiles").select("is_admin").eq("id", data.user.id).maybeSingle();
  return Boolean(profile?.is_admin);
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  try {
    const db = createServerClient();
    const { data: txns, error } = await db
      .from("transactions")
      .select("kind, amount, meta")
      .in("kind", ["airtime", "electricity", "cable_tv"])
      .in("status", ["completed", "success"])
      .order("created_at", { ascending: false })
      .limit(20000);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const airtimeByNetwork = new Map<string, Group>();
    for (const n of NETWORKS) airtimeByNetwork.set(n.id, emptyGroup());
    const electricity = emptyGroup();
    const cableTv = emptyGroup();

    for (const t of (txns ?? []) as Array<Record<string, unknown>>) {
      const meta = (t.meta && typeof t.meta === "object" ? t.meta : {}) as Record<string, unknown>;
      const panelCharge = Number(meta.panelCharge);
      if (!Number.isFinite(panelCharge) || panelCharge <= 0) continue;
      const face = Math.abs(Number(t.amount) || 0);
      if (face <= 0) continue;

      const kind = String(t.kind || "");
      const cash = Math.max(0, Math.round((face - panelCharge) * 100) / 100);

      if (kind === "airtime") {
        const network = String(meta.network || "").toLowerCase().trim();
        const g = airtimeByNetwork.get(network) ?? emptyGroup();
        g.orders += 1;
        g.volume += face;
        g.cashback += cash;
        airtimeByNetwork.set(network, g);
      } else if (kind === "electricity") {
        electricity.orders += 1;
        electricity.volume += face;
        electricity.cashback += cash;
      } else if (kind === "cable_tv") {
        cableTv.orders += 1;
        cableTv.volume += face;
        cableTv.cashback += cash;
      }
    }

    return NextResponse.json({
      ok: true,
      airtime: NETWORKS.map((n) => ({ id: n.id, label: n.label, ...finalize(airtimeByNetwork.get(n.id) ?? emptyGroup()) })),
      electricity: finalize(electricity),
      cable_tv: finalize(cableTv),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not load VTU cashback." }, { status: 500 });
  }
}
