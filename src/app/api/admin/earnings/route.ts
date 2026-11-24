import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/earnings
 *
 * Daily earnings for the panel admin:
 *   - Total transactions today (what customers paid, face value)
 *   - Verxor charge today (what Verxor deducted from the panel wallet)
 *   - Today's profit = total transactions − Verxor charge
 *   - Services ranked by today's usage (most-used first)
 *   - Last 14 days history
 *
 * "Today" follows the Africa/Lagos day (midnight to midnight).
 * Profit comes from meta.panelCharge recorded on completed orders —
 * the discounted amount Verxor actually charged at checkout.
 */

const EXCLUDED_KINDS = new Set(["refund", "cashback_claim", "funding", "deposit", "wallet_fund", "topup", "boost_refund", "logs_refund", "rent_sms_refund", "admin_manual_adjustment"]);

const KIND_LABELS: Record<string, string> = {
  airtime: "Airtime",
  data: "Data",
  electricity: "Electricity",
  rent_sms: "Rent-for-SMS",
  cable_tv: "TV subscription",
  boost: "SMM Boost",
  vn: "Virtual numbers",
  virtual_number: "Virtual numbers",
  shopping: "Shopping",
  gift_card: "Gift cards",
  buy_logs: "Buy logs",
  logs: "Buy logs",
};

const PROVIDER_LABELS: Record<string, string> = {
  mtn: "MTN",
  glo: "GLO",
  airtel: "Airtel",
  "9mobile": "9mobile",
  dstv: "DStv",
  gotv: "GOtv",
  startimes: "StarTimes",
};

function lagosToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
}

function lagosDayStartUtc(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00+01:00`).toISOString();
}

function serviceKey(kind: string, meta: Record<string, unknown>): string {
  if (kind === "airtime") return `airtime:${String(meta.network || "other").toLowerCase()}`;
  if (kind === "cable_tv") return `cable_tv:${String(meta.provider || "other").toLowerCase()}`;
  return kind;
}

function serviceLabel(key: string): string {
  if (key.startsWith("airtime:")) {
    const net = key.slice("airtime:".length);
    return `Airtime · ${PROVIDER_LABELS[net] || net.toUpperCase()}`;
  }
  if (key.startsWith("cable_tv:")) {
    const prov = key.slice("cable_tv:".length);
    return `TV · ${PROVIDER_LABELS[prov] || prov}`;
  }
  return KIND_LABELS[key] || key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
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

type Agg = { orders: number; volume: number; charge: number; missingCharge: number };

const emptyAgg = (): Agg => ({ orders: 0, volume: 0, charge: 0, missingCharge: 0 });

function addToAgg(g: Agg, face: number, charge: number | null) {
  g.orders += 1;
  g.volume = Math.round((g.volume + face) * 100) / 100;
  if (charge === null) {
    g.missingCharge += 1;
  } else {
    g.charge = Math.round((g.charge + charge) * 100) / 100;
  }
}

function profitOf(g: Agg): number {
  return Math.round((g.volume - g.charge) * 100) / 100;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  }

  try {
    const today = lagosToday();
    const todayStart = lagosDayStartUtc(today);
    const historyStart = lagosDayStartUtc(
      new Date(new Date(`${today}T00:00:00+01:00`).getTime() - 13 * 24 * 60 * 60 * 1000)
        .toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }),
    );

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const db = createServerClient();

    const { data: txns, error } = await db
      .from("transactions")
      .select("kind, amount, status, meta, created_at")
      .in("status", ["completed", "success"])
      .gte("created_at", historyStart)
      .order("created_at", { ascending: false })
      .limit(20000);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const todayAgg = emptyAgg();
    const services = new Map<string, Agg>();
    const days = new Map<string, Agg>();
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(new Date(`${today}T00:00:00+01:00`).getTime() - i * 24 * 60 * 60 * 1000)
        .toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
      days.set(d, emptyAgg());
    }

    for (const t of (txns ?? []) as Array<Record<string, unknown>>) {
      const kind = String(t.kind || "");
      if (EXCLUDED_KINDS.has(kind)) continue;
      const meta = (t.meta && typeof t.meta === "object" ? t.meta : {}) as Record<string, unknown>;
      const face = Math.abs(Number(t.amount) || 0);
      if (face <= 0) continue;

      const pc = Number(meta.panelCharge);
      const charge = Number.isFinite(pc) && pc > 0 ? pc : null;

      const createdAt = String(t.created_at || "");
      const day = createdAt.slice(0, 10);
      const isToday = createdAt >= todayStart;

      const key = serviceKey(kind, meta);

      if (isToday) {
        addToAgg(todayAgg, face, charge);
        const s = services.get(key) ?? emptyAgg();
        addToAgg(s, face, charge);
        services.set(key, s);
      }
      const d = days.get(day);
      if (d) addToAgg(d, face, charge);
      void key;
    }

    const serviceRows = [...services.entries()]
      .map(([key, g]) => ({
        key,
        label: serviceLabel(key),
        orders: g.orders,
        volume: Math.round(g.volume * 100) / 100,
        charge: Math.round(g.charge * 100) / 100,
        profit: profitOf(g),
        missingCharge: g.missingCharge,
      }))
      // Most-used service today first, then by profit
      .sort((a, b) => b.orders - a.orders || b.profit - a.profit);

    const history = [...days.entries()]
      .map(([date, g]) => ({
        date,
        orders: g.orders,
        volume: Math.round(g.volume * 100) / 100,
        charge: Math.round(g.charge * 100) / 100,
        profit: profitOf(g),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    return NextResponse.json({
      ok: true,
      today: {
        date: today,
        orders: todayAgg.orders,
        totalTransactions: Math.round(todayAgg.volume * 100) / 100,
        verxorCharge: Math.round(todayAgg.charge * 100) / 100,
        profit: profitOf(todayAgg),
        missingCharge: todayAgg.missingCharge,
      },
      services: serviceRows,
      history,
      note:
        "Total transactions = what customers paid today. Verxor charge = what Verxor deducted for those orders. Profit = the difference (cashback + your gains).",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not load earnings." },
      { status: 500 },
    );
  }
}
