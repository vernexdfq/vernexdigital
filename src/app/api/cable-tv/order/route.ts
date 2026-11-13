import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PROVIDERS = new Set(["dstv", "gotv", "startimes"]);

const PROVIDER_LABEL: Record<string, string> = {
  dstv: "DStv",
  gotv: "GOtv",
  startimes: "StarTimes",
};

/** Full catalog keyed by package id — must stay in sync with Verxor */
const BY_ID: Record<string, { provider: string; name: string; price: number }> = {
  // DStv
  "dstv-padi": { provider: "dstv", name: "Padi", price: 4400 },
  "dstv-yanga": { provider: "dstv", name: "Yanga", price: 6000 },
  "dstv-confam": { provider: "dstv", name: "Confam", price: 11000 },
  dstv79: { provider: "dstv", name: "Compact", price: 19000 },
  dstv7: { provider: "dstv", name: "Compact Plus", price: 30000 },
  dstv3: { provider: "dstv", name: "Premium", price: 44500 },
  dstv9: { provider: "dstv", name: "Premium-French", price: 69000 },
  dstv10: { provider: "dstv", name: "Premium-Asia", price: 50500 },
  "padi-extra": { provider: "dstv", name: "Padi + ExtraView", price: 10400 },
  "yanga-extra": { provider: "dstv", name: "Yanga + ExtraView", price: 12000 },
  "confam-extra": { provider: "dstv", name: "Confam + ExtraView", price: 17000 },
  dstv30: { provider: "dstv", name: "Compact + Extra View", price: 25000 },
  dstv45: { provider: "dstv", name: "Compact Plus + Extra View", price: 36000 },
  dstv33: { provider: "dstv", name: "Premium + Extra View", price: 50500 },
  "com-frenchtouch": { provider: "dstv", name: "Compact + French Touch", price: 26000 },
  "complus-frenchtouch": { provider: "dstv", name: "Compact Plus + French Touch", price: 37000 },
  "dstv-padi-showmax": { provider: "dstv", name: "Padi + Showmax", price: 8900 },
  "dstv-yanga-showmax": { provider: "dstv", name: "Yanga + Showmax", price: 8250 },
  "dstv-confam-showmax": { provider: "dstv", name: "Confam + Showmax", price: 13250 },
  "dstv-compact-showmax": { provider: "dstv", name: "Compact + Showmax", price: 21250 },
  "dstv-compact-plus-showmax": { provider: "dstv", name: "Compact Plus + Showmax", price: 32250 },
  "dstv-premium-showmax": { provider: "dstv", name: "Premium + Showmax", price: 44500 },
  "dstv-greatwall": { provider: "dstv", name: "Great Wall Standalone", price: 3800 },
  "dstv-indian": { provider: "dstv", name: "Indian", price: 14900 },
  "dstv-movie-bundle-add-on": { provider: "dstv", name: "Movie Bundle Add-on", price: 3500 },
  "frenchplus-addon": { provider: "dstv", name: "French Plus Add-on", price: 24500 },
  "frenchtouch-addon": { provider: "dstv", name: "French Touch Add-on", price: 7000 },
  // GOtv
  "gotv-smallie": { provider: "gotv", name: "Smallie", price: 1900 },
  "gotv-jinja": { provider: "gotv", name: "Jinja", price: 3900 },
  "gotv-jolli": { provider: "gotv", name: "Jolli", price: 5800 },
  "gotv-max": { provider: "gotv", name: "Max", price: 8500 },
  "gotv-supa": { provider: "gotv", name: "Supa", price: 11400 },
  "gotv-supa-plus": { provider: "gotv", name: "Supa Plus", price: 16800 },
  "gotv-smallie-3months": { provider: "gotv", name: "Smallie (3 months)", price: 5100 },
  "gotv-smallie-1year": { provider: "gotv", name: "Smallie (1 year)", price: 15000 },
  // StarTimes
  nova: { provider: "startimes", name: "Nova (Dish)", price: 2100 },
  "uni-2": { provider: "startimes", name: "Nova (Antenna)", price: 2100 },
  basic: { provider: "startimes", name: "Basic (Antenna)", price: 4000 },
  smart: { provider: "startimes", name: "Basic (Dish)", price: 5100 },
  classic: { provider: "startimes", name: "Classic (Antenna)", price: 6000 },
  "special-monthly": { provider: "startimes", name: "Classic (Dish)", price: 7400 },
  super: { provider: "startimes", name: "Super (Dish)", price: 9800 },
  "super-antenna-monthly": { provider: "startimes", name: "Super (Antenna)", price: 9500 },
  "global-monthly-dish": { provider: "startimes", name: "Global (Dish)", price: 21000 },
  "uni-1": { provider: "startimes", name: "Chinese (Dish)", price: 21000 },
  "nova-weekly": { provider: "startimes", name: "Nova (Antenna) 1 Week", price: 700 },
  "nova-dish-weekly": { provider: "startimes", name: "Nova (Dish) 1 Week", price: 700 },
  "basic-weekly": { provider: "startimes", name: "Basic (Antenna) 1 Week", price: 1400 },
  "smart-weekly": { provider: "startimes", name: "Basic (Dish) 1 Week", price: 1700 },
  "classic-weekly": { provider: "startimes", name: "Classic (Antenna) 1 Week", price: 2000 },
  "special-weekly": { provider: "startimes", name: "Classic (Dish) 1 Week", price: 2300 },
  "classic-weekly-dish": { provider: "startimes", name: "Classic (Dish) 1 Week", price: 2500 },
  "super-weekly": { provider: "startimes", name: "Super (Dish) 1 Week", price: 3300 },
  "super-antenna-weekly": { provider: "startimes", name: "Super (Antenna) 1 Week", price: 3200 },
  "global-weekly-dish": { provider: "startimes", name: "Global (Dish) 1 Week", price: 7000 },
  "shs-weekly-2800": { provider: "startimes", name: "SHS Weekly ₦2,800", price: 2800 },
  "shs-weekly-4620": { provider: "startimes", name: "SHS Weekly ₦4,620", price: 4620 },
  "shs-weekly-4900": { provider: "startimes", name: "SHS Weekly ₦4,900", price: 4900 },
  "shs-weekly-9100": { provider: "startimes", name: "SHS Weekly ₦9,100", price: 9100 },
  "shs-monthly-12000": { provider: "startimes", name: "SHS Monthly ₦12,000", price: 12000 },
  "shs-monthly-19800": { provider: "startimes", name: "SHS Monthly ₦19,800", price: 19800 },
  "shs-monthly-21000": { provider: "startimes", name: "SHS Monthly ₦21,000", price: 21000 },
  "shs-monthly-39000": { provider: "startimes", name: "SHS Monthly ₦39,000", price: 39000 },
};

async function getUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user || null;
}

async function changeWalletBalance(
  admin: ReturnType<typeof createServerClient>,
  userId: string,
  change: (balance: number) => number | null,
  attempts = 5,
): Promise<{ ok: boolean; balance?: number }> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data: wallet, error: readError } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (readError || !wallet) return { ok: false };
    const current = Number(wallet.balance) || 0;
    const next = change(current);
    if (next === null || !Number.isFinite(next) || next < 0) {
      return { ok: false, balance: current };
    }
    const rounded = Math.round(next * 100) / 100;
    const { data, error } = await admin
      .from("wallets")
      .update({ balance: rounded, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("balance", current)
      .select("balance");
    if (!error && data?.length) return { ok: true, balance: Number(data[0].balance) };
  }
  return { ok: false };
}

function normalizeNgPhone(raw: string): string | null {
  let clean = String(raw).replace(/\D/g, "");
  if (clean.startsWith("234") && clean.length >= 13) {
    clean = "0" + clean.slice(3);
  }
  if (!/^0[7-9]\d{9}$/.test(clean)) return null;
  return clean;
}

/**
 * POST /api/cable-tv/order
 * Debit face amount → Verxor /tv pay → refund on fail.
 */
export async function POST(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." },
      { status: 503 },
    );
  }

  const user = await getUser(req);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to pay TV subscription." },
      { status: 401 },
    );
  }

  let body: {
    provider?: string;
    packageId?: string;
    packageName?: string;
    smartCardNo?: string;
    phone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const provider = String(body.provider || "").toLowerCase().trim();
  if (!PROVIDERS.has(provider)) {
    return NextResponse.json(
      { ok: false, error: "Invalid TV provider. Use DStv, GOtv or StarTimes." },
      { status: 400 },
    );
  }

  const smartCardNo = String(body.smartCardNo || "").replace(/\D/g, "");
  if (smartCardNo.length < 8 || smartCardNo.length > 15) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid smartcard / IUC number" },
      { status: 400 },
    );
  }

  const packageId = String(body.packageId || "").trim();
  const catalog = BY_ID[packageId];
  if (!catalog || catalog.provider !== provider) {
    return NextResponse.json({ ok: false, error: "Select a valid package" }, { status: 400 });
  }
  if (!catalog.price || catalog.price < 100) {
    return NextResponse.json({ ok: false, error: "Invalid package price" }, { status: 400 });
  }

  const phone = normalizeNgPhone(String(body.phone || ""));
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid 11-digit Nigerian phone number" },
      { status: 400 },
    );
  }

  const admin = createServerClient();
  const amount = catalog.price;
  const ref = `tv-${user.id.slice(0, 8)}-${Date.now()}`;
  const label = PROVIDER_LABEL[provider] || provider;
  const pkgName = catalog.name;

  const debited = await changeWalletBalance(admin, user.id, (b) =>
    b >= amount ? b - amount : null,
  );
  if (!debited.ok) {
    return NextResponse.json(
      { ok: false, error: "Insufficient wallet balance. Fund your wallet first." },
      { status: 402 },
    );
  }

  void admin.from("transactions").insert({
    user_id: user.id,
    kind: "cable_tv",
    title: `${label} ${pkgName} · ${smartCardNo} · ₦${amount.toLocaleString("en-NG")}`,
    amount: -amount,
    status: "pending",
    meta: { provider, packageId, packageName: pkgName, smartCardNo, amount, phone, ref },
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    let res: Response;
    try {
      res = await verxorFetch("/tv", {
        method: "POST",
        body: JSON.stringify({
          action: "pay",
          provider,
          packageId,
          smartCardNo,
          phone,
          ref,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || data.ok === false) {
      await changeWalletBalance(admin, user.id, (b) => b + amount);
      void admin.from("transactions").insert({
        user_id: user.id,
        kind: "refund",
        title: `Refund — ${label} ${pkgName}`,
        amount: amount,
        status: "completed",
        meta: {
          provider,
          packageId,
          smartCardNo,
          amount,
          ref,
          reason: data.error || "provider_failed",
        },
      });
      return NextResponse.json(
        {
          ok: false,
          error: String(data.error || "TV subscription failed at provider"),
          refunded: true,
        },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
      );
    }

    const order = (data.order || {}) as Record<string, unknown>;

    const completedIns = await admin.from("transactions").insert({
      user_id: user.id,
      kind: "cable_tv",
      title: `${label} ${pkgName} · ₦${amount.toLocaleString("en-NG")} — success`,
      amount: -amount,
      status: "completed",
      meta: {
        provider,
        packageId,
        packageName: pkgName,
        smartCardNo,
        amount,
        phone,
        ref: order.ref || ref,
        customerName: order.customerName,
        panelCharge: data.balanceDebited,
        walletMode: data.walletMode,
      },
    });
    if (completedIns.error) {
      console.error("cable_tv completed transaction insert failed:", completedIns.error.message);
    }

    return NextResponse.json({
      ok: true,
      order: {
        ref: order.ref || ref,
        status: order.status || "successful",
        smartCardNo: order.smartCardNo || smartCardNo,
        amount: order.amount || amount,
        provider: order.provider || provider,
        packageName: order.packageName || pkgName,
        customerName: order.customerName || null,
        message:
          order.message ||
          `${label} ${pkgName} activated · ₦${amount.toLocaleString("en-NG")}`,
      },
    });
  } catch (e) {
    await changeWalletBalance(admin, user.id, (b) => b + amount);
    const aborted = e instanceof Error && e.name === "AbortError";
    const message = aborted
      ? "TV subscription timed out — wallet refunded. Try again."
      : e instanceof Error
        ? e.message
        : "TV subscription failed";
    void admin.from("transactions").insert({
      user_id: user.id,
      kind: "refund",
      title: `Refund — ${label} ${pkgName}`,
      amount: amount,
      status: "completed",
      meta: {
        provider,
        packageId,
        smartCardNo,
        amount,
        ref,
        reason: aborted ? "timeout" : "exception",
      },
    });
    return NextResponse.json({ ok: false, error: message, refunded: true }, { status: 502 });
  }
}
