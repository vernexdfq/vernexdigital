import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { UI_POOL_TO_VERXOR, SERVICE_NAME_TO_CODE } from "@/lib/verxor-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

/**
 * Buy VN: debit end-user wallet, call Verxor (debits panel reseller_wallet),
 * persist to vn_orders with wholesale for later dual refunds on cancel.
 */
export async function POST(req: NextRequest) {
  const { configured } = verxorConfig();
  if (!configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." },
      { status: 503 },
    );
  }

  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in to buy a number." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const serviceRaw = String(body.service || "").trim();
  const country = String(body.country || body.grizzlyCountry || "").trim();
  const uiPool = String(body.pool || body.poolId || "").trim();
  const priceNgn = Math.round(Number(body.priceNgn) || 0);
  const wholesaleNgn = Math.round(Number(body.wholesaleNgn) || 0);
  const maxPriceUsd = Number(body.maxPriceUsd) || Number(body.costUsd) || 0.5;

  const service = SERVICE_NAME_TO_CODE[serviceRaw] || serviceRaw.toLowerCase();
  const map = UI_POOL_TO_VERXOR[uiPool];
  const poolId = map?.verxorPool || uiPool;

  if (!service || !country) {
    return NextResponse.json(
      { ok: false, error: "service and country are required" },
      { status: 400 },
    );
  }
  if (priceNgn < 50) {
    return NextResponse.json({ ok: false, error: "Invalid price" }, { status: 400 });
  }

  const admin = createServerClient();

  const { data: wallet } = await admin
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();
  const bal = Number(wallet?.balance) || 0;
  if (bal < priceNgn) {
    return NextResponse.json(
      { ok: false, error: "Insufficient wallet balance. Fund your wallet first." },
      { status: 402 },
    );
  }

  const ref = `vn_${user.id.slice(0, 8)}_${Date.now()}`;
  const panelCharge = wholesaleNgn > 0 ? wholesaleNgn : priceNgn;
  const newBal = Math.round((bal - priceNgn) * 100) / 100;
  const { error: debitErr } = await admin
    .from("wallets")
    .update({ balance: newBal, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (debitErr) {
    return NextResponse.json({ ok: false, error: "Could not debit wallet" }, { status: 500 });
  }

  await admin.from("transactions").insert({
    user_id: user.id,
    kind: "virtual_number",
    title: `Virtual number · ${serviceRaw || service}`,
    amount: -priceNgn,
    status: "pending",
    meta: { service, country, pool: uiPool, wholesaleNgn: panelCharge, ref },
  });

  try {
    const res = await verxorFetch("/numbers/buy", {
      method: "POST",
      body: JSON.stringify({
        service,
        country,
        maxPriceUsd: maxPriceUsd > 0 ? maxPriceUsd : 1,
        poolId,
        priceNgn: panelCharge,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      await admin
        .from("wallets")
        .update({ balance: bal, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      await admin.from("transactions").insert({
        user_id: user.id,
        kind: "virtual_number_refund",
        title: "Virtual number refund",
        amount: priceNgn,
        status: "completed",
        meta: { ref, reason: data.error || "buy failed" },
      });
      // Verxor buy already refunds reseller_wallet if it debited before provider fail
      return NextResponse.json(
        { ok: false, error: data.error || "Purchase failed at provider" },
        { status: 502 },
      );
    }

    const order = data.order || {};
    const providerOrderId = String(order.providerOrderId || order.id || "");
    const phone = String(order.phone || "");

    let savedId: string | null = null;
    try {
      const insertRow: Record<string, unknown> = {
        user_id: user.id,
        provider: "grizzly",
        provider_order_id: providerOrderId,
        phone,
        service: serviceRaw || service,
        country: order.country || country,
        pool_id: uiPool || null,
        price_ngn: priceNgn,
        status: "waiting",
        refunded: false,
      };
      // Optional column — ignore if migration not applied yet
      if (panelCharge > 0) insertRow.wholesale_ngn = panelCharge;

      const { data: row } = await admin
        .from("vn_orders")
        .insert(insertRow)
        .select("id")
        .maybeSingle();
      if (row?.id) savedId = String(row.id);
    } catch {
      /* table may lag; sessionStorage still works */
    }

    try {
      await admin
        .from("transactions")
        .update({
          status: "completed",
          meta: {
            service,
            country,
            pool: uiPool,
            wholesaleNgn: panelCharge,
            providerOrderId,
            ref,
          },
        })
        .eq("user_id", user.id)
        .eq("kind", "virtual_number")
        .contains("meta", { ref });
    } catch {
      /* optional */
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: savedId || order.id || providerOrderId,
        providerOrderId,
        phone,
        service: order.service || service,
        country: order.country || country,
        poolId: uiPool,
        priceNgn,
        wholesaleNgn: panelCharge,
        status: "waiting",
        provider: "grizzly",
      },
    });
  } catch (e) {
    await admin
      .from("wallets")
      .update({ balance: bal, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    const message = e instanceof Error ? e.message : "Buy failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
