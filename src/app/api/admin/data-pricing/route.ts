import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  /api/admin/data-pricing — panel data pricing overrides.
 * Aggregate: Verxor child price (cost to panel) + your selling price per plan.
 * PUT  — upsert an override for (planId, network). null price = use Verxor retail.
 * Auth: partner admin cookie or profiles.is_admin (same as /api/admin/vtu).
 */

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

type VerxorPlan = {
  id: number;
  network: string;
  size: string;
  days: string;
  tab: string;
  price: number; // child (wholesale to this panel)
  retail: number;
};

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  if (!verxorConfig().configured) {
    return NextResponse.json({ ok: false, error: "Data is not configured on this panel." }, { status: 503 });
  }
  try {
    const res = await verxorFetch("/data/plans");
    const data = (await res.json().catch(() => ({}))) as { networks?: Record<string, VerxorPlan[]> };
    const plans: VerxorPlan[] = Object.values(data.networks || {}).flat();
    const db = createServerClient();
    const { data: overrides, error: ovErr } = await db.from("data_price_overrides").select("*");
    if (ovErr) {
      return NextResponse.json({ ok: false, error: ovErr.message }, { status: 500 });
    }
    const map = new Map<string, Record<string, unknown>>();
    for (const o of overrides ?? []) map.set(`${o.plan_id}:${o.network}`, o);
    const rows = plans.map((p) => {
      const o = map.get(`${p.id}:${p.network}`) as
        | { override_price: number | null; label: string | null; featured: boolean | null; visible: boolean | null; updated_at: string | null }
        | undefined;
      return {
        planId: p.id,
        network: p.network,
        size: p.size,
        days: p.days,
        tab: p.tab,
        childPrice: p.price,
        defaultPrice: p.retail,
        yourPrice: o?.override_price ?? p.retail,
        label: o?.label ?? null,
        featured: Boolean(o?.featured),
        visible: o?.visible !== false,
        hasOverride: Boolean(o),
      };
    });
    return NextResponse.json({ ok: true, rows, total: rows.length });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Could not load data pricing." },
      { status: 502 },
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }
  let body: {
    planId?: number;
    network?: string;
    yourPrice?: number | null;
    label?: string | null;
    visible?: boolean;
    featured?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const planId = Number(body.planId);
  const network = String(body.network || "").toLowerCase();
  if (!Number.isFinite(planId) || planId <= 0 || !["mtn", "glo", "airtel", "9mobile"].includes(network)) {
    return NextResponse.json({ ok: false, error: "Invalid plan" }, { status: 400 });
  }
  const price =
    body.yourPrice === null || body.yourPrice === undefined
      ? null
      : Number(body.yourPrice) > 0
        ? Math.round(Number(body.yourPrice) * 100) / 100
        : null;
  const db = createServerClient();
  const { error } = await db.from("data_price_overrides").upsert(
    {
      plan_id: planId,
      network,
      override_price: price,
      label: body.label?.trim() ? body.label.trim() : null,
      featured: Boolean(body.featured),
      visible: body.visible !== false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "plan_id, network" },
  );
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
