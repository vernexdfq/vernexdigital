import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { orderAmountNgn, panelRetailRatePer1000 } from "@/lib/boost-pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const { configured, base } = verxorConfig();
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

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const serviceId = String(body.serviceId || body.service || "").trim();
  const link = String(body.link || "").trim();
  const quantity = Math.round(Number(body.quantity) || 0);

  if (!serviceId) {
    return NextResponse.json({ ok: false, error: "Service is required" }, { status: 400 });
  }
  if (!link || link.length < 5) {
    return NextResponse.json({ ok: false, error: "Valid target link is required" }, { status: 400 });
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    return NextResponse.json({ ok: false, error: "Invalid quantity" }, { status: 400 });
  }

  // 100% SERVER-AUTHORITATIVE PRICING VALIDATION
  // Never trust wholesaleUsd or ratePer1000 from client payload.
  let catalogServices: Array<{
    id: string;
    providerId: number;
    platform: string;
    platformName: string;
    category: string;
    categoryName: string;
    title: string;
    wholesaleUsd: number;
    min: number;
    max: number;
    speed?: string;
  }> = [];

  try {
    const catRes = configured
      ? await verxorFetch("/boost/catalog")
      : await fetch(`${base}/boost/catalog`, { cache: "no-store" });
    const catData = await catRes.json().catch(() => ({}));
    if (catRes.ok && Array.isArray(catData.services)) {
      catalogServices = catData.services;
    }
  } catch (err: unknown) {
    console.error("[boost/order] Catalog fetch error:", err);
  }

  if (!catalogServices.length) {
    return NextResponse.json(
      { ok: false, error: "Service catalog is temporarily unavailable. Please retry in a few moments." },
      { status: 503 },
    );
  }

  const service = catalogServices.find(
    (s) => String(s.id) === serviceId || String(s.providerId) === serviceId,
  );

  if (!service) {
    return NextResponse.json(
      { ok: false, error: "Service not found or no longer available" },
      { status: 404 },
    );
  }

  const wholesaleUsd = Number(service.wholesaleUsd) || 0;
  if (wholesaleUsd <= 0) {
    return NextResponse.json(
      { ok: false, error: "Invalid provider service pricing" },
      { status: 400 },
    );
  }

  const minQty = Number(service.min) || 1;
  const maxQty = Number(service.max) || 1000000;
  if (quantity < minQty || quantity > maxQty) {
    return NextResponse.json(
      {
        ok: false,
        error: `Quantity must be between ${minQty.toLocaleString("en-NG")} and ${maxQty.toLocaleString("en-NG")}`,
      },
      { status: 400 },
    );
  }

  // Authoritative calculations from locked formula
  const ratePer1000 = panelRetailRatePer1000(wholesaleUsd);
  const priceNgn = orderAmountNgn(ratePer1000, quantity);

  if (!Number.isFinite(priceNgn) || priceNgn < 1) {
    return NextResponse.json({ ok: false, error: "Invalid order amount calculation" }, { status: 400 });
  }

  const admin = createServerClient();
  const ref = `boost-${user.id.slice(0, 8)}-${Date.now()}`;

  // Compare-and-set debit prevents concurrent requests from spending the same balance.
  const debit = await changeWalletBalance(admin, user.id, (current) =>
    current < priceNgn ? null : current - priceNgn,
  );
  if (!debit.ok) {
    const { data: latest } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    const currentBalance = Number(latest?.balance) || 0;
    if (currentBalance < priceNgn) {
      return NextResponse.json(
        {
          ok: false,
          error: "Insufficient wallet balance. Fund your wallet first.",
          need: Math.round((priceNgn - currentBalance) * 100) / 100,
        },
        { status: 402 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Wallet changed during checkout. Please retry." },
      { status: 409 },
    );
  }
  const newBal = debit.balance ?? 0;
  const restoreWallet = async () => {
    const refund = await changeWalletBalance(admin, user.id, (current) => current + priceNgn);
    if (!refund.ok) console.error("[boost/order] Automatic wallet refund requires review", { userId: user.id, ref });
    return refund.ok;
  };

  const serviceTitle = service.title || "Social Boost";
  const customerEmail = user.email || "";
  const customerName =
    (user.user_metadata?.full_name && String(user.user_metadata.full_name).trim()) ||
    customerEmail;

  // Record pending transaction
  try {
    await admin.from("transactions").insert({
      user_id: user.id,
      kind: "boost",
      title: `Boost — ${serviceTitle} × ${quantity.toLocaleString("en-NG")}`,
      amount: -priceNgn,
      status: "pending",
      meta: {
        ref,
        serviceId: service.id,
        providerId: service.providerId,
        link,
        quantity,
        ratePer1000,
        wholesaleUsd,
      },
    });
  } catch {
    /* optional ledger */
  }

  // Forward order to Verxor provider with customer details for alert reconciliation
  try {
    const res = await verxorFetch("/boost", {
      method: "POST",
      body: JSON.stringify({
        serviceId: service.providerId || service.id,
        link,
        quantity,
        ref,
        retailPriceNgn: priceNgn,
        customerPaidNgn: priceNgn,
        customerEmail: customerEmail || undefined,
        customerName: customerName || undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      // Auto-refund user wallet on upstream failure
      const refunded = await restoreWallet();

      try {
        await admin.from("transactions").insert({
          user_id: user.id,
          kind: "boost_refund",
          title: `Refund: Boost failed (${serviceTitle})`,
          amount: priceNgn,
          status: "completed",
          meta: { ref, reason: data.error || "Provider error" },
        });
      } catch {
        /* optional */
      }

      return NextResponse.json(
        { ok: false, error: data.error || "Boost order failed at provider", refunded },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    const order = data.order || {};
    const providerOrderId = String(order.ref || order.providerOrderId || order.id || "");

    try {
      await admin.from("transactions").insert({
        user_id: user.id,
        kind: "boost",
        title: order.title || `Boost #${providerOrderId} — ${serviceTitle}`,
        amount: -priceNgn,
        status: "completed",
        meta: {
          ref,
          providerOrderId,
          serviceId: service.id,
          providerId: service.providerId,
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
        serviceId: service.id,
        serviceTitle,
        platform: service.platform,
        platformName: service.platformName,
        link,
        quantity,
        amount: priceNgn,
        ratePer1000,
        message: order.message || `Boost order placed successfully (${quantity.toLocaleString("en-NG")})`,
        provider: "smm",
        priceMode: "retail",
      },
      balanceDebited: priceNgn,
      balance: newBal,
    });
  } catch (e: unknown) {
    // The provider may have accepted an order before a network/response failure.
    // Keep the debit and mark it for verification rather than risking a duplicate
    // order plus an incorrect automatic refund.
    console.error("[boost/order] Provider outcome needs verification", { ref, error: e });
    return NextResponse.json({
      ok: true,
      orderPendingVerification: true,
      order: {
        id: ref,
        providerOrderId: ref,
        status: "processing",
        serviceId: service.id,
        serviceTitle,
        platform: service.platform,
        platformName: service.platformName,
        link,
        quantity,
        amount: priceNgn,
        ratePer1000,
        message: "Your order is being verified. Please don't submit it again; check your order history shortly.",
        provider: "smm",
        priceMode: "retail",
      },
      balanceDebited: priceNgn,
      balance: newBal,
      reference: ref,
    }, { status: 202 });
  }
}
