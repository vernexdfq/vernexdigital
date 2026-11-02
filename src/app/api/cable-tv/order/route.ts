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

/** Face prices must match Verxor cable-catalog / ClubKonnect */
const PACKAGE_CATALOG: Record<
  string,
  Record<string, { id: string; price: number }>
> = {
  dstv: {
    padi: { id: "dstv-padi", price: 4400 },
    yanga: { id: "dstv-yanga", price: 6000 },
    confam: { id: "dstv-confam", price: 11000 },
    compact: { id: "dstv79", price: 19000 },
    "compact plus": { id: "dstv7", price: 30000 },
    premium: { id: "dstv3", price: 44500 },
  },
  gotv: {
    smallie: { id: "gotv-smallie", price: 1900 },
    jinja: { id: "gotv-jinja", price: 3900 },
    jolli: { id: "gotv-jolli", price: 5800 },
    max: { id: "gotv-max", price: 8500 },
    supa: { id: "gotv-supa", price: 11400 },
    "supa plus": { id: "gotv-supa-plus", price: 16800 },
  },
  startimes: {
    nova: { id: "nova", price: 2100 },
    basic: { id: "basic", price: 4000 },
    smart: { id: "smart", price: 5100 },
    classic: { id: "classic", price: 6000 },
    super: { id: "super", price: 9800 },
  },
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

function resolvePackage(
  provider: string,
  packageName: string,
): { id: string; price: number; name: string } | null {
  const map = PACKAGE_CATALOG[provider];
  if (!map) return null;
  const key = packageName.trim().toLowerCase();
  const hit = map[key];
  if (!hit) return null;
  return { id: hit.id, price: hit.price, name: packageName.trim() };
}

/**
 * POST /api/cable-tv/order
 * Debit customer face amount → Verxor panel /tv → refund on fail.
 * Panel is charged at 0.5% discount by Verxor (ClubKonnect ~1%).
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
    packageName?: string;
    packageId?: string;
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

  const pkg =
    resolvePackage(provider, String(body.packageName || "")) ||
    (body.packageId
      ? { id: String(body.packageId), price: 0, name: String(body.packageName || body.packageId) }
      : null);
  if (!pkg || !pkg.id) {
    return NextResponse.json({ ok: false, error: "Select a valid package" }, { status: 400 });
  }
  if (!pkg.price || pkg.price < 100) {
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
  const amount = pkg.price;
  const ref = `tv-${user.id.slice(0, 8)}-${Date.now()}`;
  const label = PROVIDER_LABEL[provider] || provider;

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
    title: `${label} ${pkg.name} · ${smartCardNo} · ₦${amount.toLocaleString("en-NG")}`,
    amount: -amount,
    status: "pending",
    meta: { provider, packageId: pkg.id, packageName: pkg.name, smartCardNo, amount, phone, ref },
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
          packageId: pkg.id,
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
        title: `Refund — ${label} ${pkg.name}`,
        amount: amount,
        status: "completed",
        meta: {
          provider,
          packageId: pkg.id,
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

    void admin.from("transactions").insert({
      user_id: user.id,
      kind: "cable_tv",
      title: `${label} ${pkg.name} · ₦${amount.toLocaleString("en-NG")} — success`,
      amount: -amount,
      status: "completed",
      meta: {
        provider,
        packageId: pkg.id,
        packageName: pkg.name,
        smartCardNo,
        amount,
        phone,
        ref: order.ref || ref,
        customerName: order.customerName,
        panelCharge: data.balanceDebited,
        walletMode: data.walletMode,
      },
    });

    return NextResponse.json({
      ok: true,
      order: {
        ref: order.ref || ref,
        status: order.status || "successful",
        smartCardNo: order.smartCardNo || smartCardNo,
        amount: order.amount || amount,
        provider: order.provider || provider,
        packageName: order.packageName || pkg.name,
        customerName: order.customerName || null,
        message:
          order.message ||
          `${label} ${pkg.name} activated · ₦${amount.toLocaleString("en-NG")}`,
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
      title: `Refund — ${label} ${pkg.name}`,
      amount: amount,
      status: "completed",
      meta: {
        provider,
        packageId: pkg.id,
        smartCardNo,
        amount,
        ref,
        reason: aborted ? "timeout" : "exception",
      },
    });
    return NextResponse.json({ ok: false, error: message, refunded: true }, { status: 502 });
  }
}
