import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { VN_DEFAULT_PRICING, type VnPricingConfig, type VnTierId } from "@/lib/vn-panel-pricing";
import { PARTNER_ADMIN_COOKIE, verifyPartnerAdminToken } from "@/lib/partner-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function isAdmin(req: NextRequest) {
  const partner = req.cookies.get(PARTNER_ADMIN_COOKIE)?.value;
  if (partner && verifyPartnerAdminToken(partner).ok) return true;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return false;
  const auth = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await auth.auth.getUser();
  if (!data.user) return false;
  const db = createServerClient();
  const { data: profile } = await db.from("profiles").select("is_admin").eq("id", data.user.id).maybeSingle();
  return Boolean(profile?.is_admin);
}

function validConfig(value: unknown): value is VnPricingConfig {
  if (!value || typeof value !== "object" || !("tiers" in value)) return false;
  const tiers = (value as VnPricingConfig).tiers;
  const ids: VnTierId[] = ["economy", "standard", "fast", "premium"];
  return ids.every((id) => {
    const t = tiers?.[id];
    if (!t || typeof t !== "object") return false;
    const markup = Number(t.markup);
    const validBound = (n: unknown) => n === null || (typeof n === "number" && Number.isFinite(n) && n > 0);
    return Number.isFinite(markup) && markup >= 1.05 && markup <= 10 && validBound(t.minNgn) && validBound(t.maxNgn) &&
      !(t.minNgn !== null && t.maxNgn !== null && Number(t.minNgn) >= Number(t.maxNgn));
  });
}

export async function GET() {
  try {
    const db = createServerClient();
    const { data, error } = await db.from("site_settings").select("virtual_number_pricing").eq("id", 1).maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: "Virtual-number pricing is not initialized. Apply the reliability migration." }, { status: 503 });
    return NextResponse.json({ ok: true, persisted: Boolean(data?.virtual_number_pricing), config: data?.virtual_number_pricing || VN_DEFAULT_PRICING });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Pricing unavailable" }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  if (!validConfig(body.config)) return NextResponse.json({ ok: false, error: "Invalid pricing configuration" }, { status: 400 });
  try {
    const db = createServerClient();
    const { error } = await db.from("site_settings").update({ virtual_number_pricing: body.config, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return NextResponse.json({ ok: false, error: "Could not save shared pricing. Apply the reliability migration." }, { status: 503 });
    return NextResponse.json({ ok: true, config: body.config });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Could not save pricing" }, { status: 500 });
  }
}
