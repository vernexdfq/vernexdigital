import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DISCO_MAP: Record<string, string> = {
  ikeja: "ikeja",
  eko: "eko",
  ibadan: "ibadan",
  abuja: "abuja",
  kaduna: "kaduna",
  kano: "kano",
  jos: "jos",
  phed: "ph",
  ph: "ph",
  enugu: "enugu",
  benin: "benin",
  yola: "yola",
  aba: "aba",
};

const DISCO_LABEL: Record<string, string> = {
  ikeja: "Ikeja Electric",
  eko: "Eko Electric",
  ibadan: "Ibadan Electric",
  abuja: "Abuja Electric",
  kaduna: "Kaduna Electric",
  kano: "Kano Electric",
  jos: "Jos Electric",
  ph: "Port Harcourt Electric",
  enugu: "Enugu Electric",
  benin: "Benin Electric",
  yola: "Yola Electric",
  aba: "Aba Electric",
};

const MIN_AMOUNT = 1000;
const MAX_AMOUNT = 200000;

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
 * POST /api/electricity/order
 * Debit customer face amount → Verxor panel electricity API → refund on fail.
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
    return NextResponse.json({ ok: false, error: "Sign in to pay electricity." }, { status: 401 });
  }

  let body: {
    disco?: string;
    meterType?: string;
    meterNo?: string;
    amount?: number;
    phone?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const discoRaw = String(body.disco || "").toLowerCase().trim();
  const disco = DISCO_MAP[discoRaw];
  if (!disco) {
    return NextResponse.json({ ok: false, error: "Invalid electricity company" }, { status: 400 });
  }

  const meterTypeRaw = String(body.meterType || "prepaid").toLowerCase();
  const meterType = meterTypeRaw === "postpaid" ? "postpaid" : "prepaid";
  const meterNo = String(body.meterNo || "").replace(/\D/g, "");
  if (meterNo.length < 8 || meterNo.length > 15) {
    return NextResponse.json({ ok: false, error: "Enter a valid meter number" }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT) {
    return NextResponse.json(
      { ok: false, error: `Minimum payment is ₦${MIN_AMOUNT.toLocaleString("en-NG")}` },
      { status: 400 },
    );
  }
  if (amount > MAX_AMOUNT) {
    return NextResponse.json(
      { ok: false, error: `Maximum payment is ₦${MAX_AMOUNT.toLocaleString("en-NG")}` },
      { status: 400 },
    );
  }

  const phone = normalizeNgPhone(String(body.phone || ""));
  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid 11-digit Nigerian phone number" },
      { status: 400 },
    );
  }

  const admin = createServerClient();
  const ref = `el-${user.id.slice(0, 8)}-${Date.now()}`;
  const discoLabel = DISCO_LABEL[disco] || disco;
  const typeLabel = meterType === "prepaid" ? "Prepaid" : "Postpaid";

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
    kind: "electricity",
    title: `${discoLabel} ${typeLabel} · ${meterNo} · ₦${amount.toLocaleString("en-NG")}`,
    amount: -amount,
    status: "pending",
    meta: { disco, meterType, meterNo, amount, phone, ref },
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45_000);
    let res: Response;
    try {
      res = await verxorFetch("/electricity", {
        method: "POST",
        body: JSON.stringify({
          action: "pay",
          disco,
          meterType,
          meterNo,
          amount,
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
        title: `Refund — ${discoLabel} electricity`,
        amount: amount,
        status: "completed",
        meta: { disco, meterNo, amount, ref, reason: data.error || "provider_failed" },
      });
      return NextResponse.json(
        {
          ok: false,
          error: String(data.error || "Electricity payment failed at provider"),
          refunded: true,
        },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
      );
    }

    const order = (data.order || {}) as Record<string, unknown>;
    const token = order.token ? String(order.token) : null;

    void admin.from("transactions").insert({
      user_id: user.id,
      kind: "electricity",
      title: token
        ? `${discoLabel} token · ₦${amount.toLocaleString("en-NG")}`
        : `${discoLabel} ${typeLabel} · ₦${amount.toLocaleString("en-NG")} — success`,
      amount: -amount,
      status: "completed",
      meta: {
        disco,
        meterType,
        meterNo,
        amount,
        phone,
        ref: order.ref || ref,
        token,
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
        meterNo: order.meterNo || meterNo,
        amount: order.amount || amount,
        disco: order.disco || disco,
        meterType: order.meterType || meterType,
        token,
        customerName: order.customerName || null,
        message:
          order.message ||
          (token
            ? `Token ready · ₦${amount.toLocaleString("en-NG")} · ${discoLabel}`
            : `${discoLabel} payment successful`),
      },
    });
  } catch (e) {
    await changeWalletBalance(admin, user.id, (b) => b + amount);
    const aborted = e instanceof Error && e.name === "AbortError";
    const message = aborted
      ? "Electricity timed out — wallet refunded. Try again."
      : e instanceof Error
        ? e.message
        : "Electricity failed";
    void admin.from("transactions").insert({
      user_id: user.id,
      kind: "refund",
      title: `Refund — ${discoLabel} electricity`,
      amount: amount,
      status: "completed",
      meta: { disco, meterNo, amount, ref, reason: aborted ? "timeout" : "exception" },
    });
    return NextResponse.json({ ok: false, error: message, refunded: true }, { status: 502 });
  }
}
