import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { orderAmountNgn, panelRetailRatePer1000 } from "@/lib/boost-pricing";

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
    return NextResponse.json(
      { ok: false, error: "Sign in to place a boost order." },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const serviceId = String(body.serviceId || body.service || "").trim();
  const link = String(body.link || "").trim();
  const quantity = Math.round(Number(body.quantity) || 0);
  const wholesaleUsd = Number(body.wholesaleUsd);
  const clientRate = Number(body.ratePer1000);

  if (!serviceId) {
    return NextResponse.json({ ok: false, error: "Service is required" }, { status: 400 });
  }
  if (!link || link.length < 5) {
    return NextResponse.json({ ok: false, error: "Valid target link is required" }, { status: 400 });
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    return NextResponse.json({ ok: false, error: "Invalid quantity" }, { status: 400 });
  }

  let ratePer1000 =
    Number.isFinite(wholesaleUsd) && wholesaleUsd > 0
      ? panelRetailRatePer1000(wholesaleUsd)
      : clientRate;
  if (!Number.isFinite(ratePer1000) || ratePer1000 <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid service rate" }, { status: 400 });
  }

  const priceNgn = orderAmountNgn(ratePer1000, quantity);
  if (priceNgn < 1) {
    return NextResponse.json({ ok: false, error: "Invalid order amount" }, { status: 400 });
  }

  const admin = createServerClient();
  const ref = `boost-${user.id.slice(0, 8)}-${Date.now()}`;

  const { data: wallet } = await admin
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const bal = Number(wallet?.balance) || 0;
  if (bal < priceNgn) {
    return NextResponse.json(
      {
        ok: false,
        error: "Insufficient wallet balance. Fund your wallet first.",
        need: Math.round((priceNgn - bal) * 100) / 100,
      },
      { status: 402 },
    );
  }

  const newBal = Math.round((bal - priceNgn) * 100) / 100;
  const { error: debErr } = await admin
    .from("wallets")
    .update({ balance: newBal, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (debErr) {
    return NextResponse.json({ ok: false, error: "Wallet debit failed" }, { status: 500 });
  }

  try {
    await admin.from("transactions").insert({
      user_id: user.id,
      kind: "boost",
      title: `Boost order × ${quantity}`,
      amount: -priceNgn,
      status: "pending",
      meta: { ref, serviceId, link, quantity, ratePer1000 },
    });
  } catch {
    /* optional */
  }

  try {
    const res = await verxorFetch("/boost", {
      method: "POST",
      body: JSON.stringify({ serviceId, link, quantity }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      await admin
        .from("wallets")
        .update({ balance: bal, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
      try {
        await admin.from("transactions").insert({
          user_id: user.id,
          kind: "boost_refund",
          title: "Boost order refund",
          amount: priceNgn,
          status: "completed",
          meta: { ref, reason: data.error || "provider failed" },
        });
      } catch {
        /* optional */
      }
      return NextResponse.json(
        { ok: false, error: data.error || "Boost order failed at provider", refunded: true },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    const order = data.order || {};
    const providerOrderId = String(order.ref || order.providerOrderId || order.id || "");

    try {
      await admin.from("transactions").insert({
        user_id: user.id,
        kind: "boost",
        title: order.title || `Boost #${providerOrderId}`,
        amount: -priceNgn,
        status: "completed",
        meta: {
          ref,
          providerOrderId,
          serviceId,
          link,
          quantity,
          priceNgn,
          wholesaleCharged: data.balanceDebited,
          walletMode: data.walletMode,
        },
      });
    } catch {
      /* optional */
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: providerOrderId,
        providerOrderId,
        status: order.status || "processing",
        serviceId: order.serviceId || serviceId,
        serviceTitle: order.serviceTitle || order.title,
        platform: order.platform,
        platformName: order.platformName,
        link,
        quantity,
        amount: priceNgn,
        ratePer1000,
        message: order.message || "Boost order was successful",
        provider: "smm",
        priceMode: data.order?.priceMode || "partner",
      },
      balanceDebited: priceNgn,
      balance: newBal,
    });
  } catch (e) {
    await admin
      .from("wallets")
      .update({ balance: bal, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    const msg = e instanceof Error ? e.message : "Order failed";
    return NextResponse.json({ ok: false, error: msg, refunded: true }, { status: 502 });
  }
}
