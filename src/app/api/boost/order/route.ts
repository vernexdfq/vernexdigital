import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { orderAmountNgn, panelRetailRatePer1000 } from "@/lib/boost-pricing";
import { getAuthoritativeCatalog } from "@/lib/boost-catalog-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

/** Parse Verxor error body even when response is HTML / empty / non-JSON. */
async function readUpstream(res: Response): Promise<{
  data: Record<string, unknown>;
  rawText: string;
}> {
  const rawText = await res.text().catch(() => "");
  if (!rawText?.trim()) return { data: {}, rawText: "" };
  try {
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    return { data: parsed && typeof parsed === "object" ? parsed : {}, rawText };
  } catch {
    return { data: {}, rawText };
  }
}

function upstreamErrorMessage(
  res: Response,
  data: Record<string, unknown>,
  rawText: string,
): string {
  const fromJson =
    (typeof data.error === "string" && data.error.trim()) ||
    (typeof data.message === "string" && data.message.trim()) ||
    (typeof data.reason === "string" && data.reason.trim()) ||
    "";
  if (fromJson) return fromJson;

  if (res.status === 401) {
    return "Panel key rejected by Verxor. Check VERXOR_PANEL_API_KEY.";
  }
  if (res.status === 402) {
    return "Insufficient panel wholesale balance. Fund the partner wallet first.";
  }
  if (res.status === 403) {
    return "This panel key is not allowed to place boost orders.";
  }
  if (res.status === 404) {
    return "Service not available on Verxor.";
  }
  if (res.status === 503) {
    return "Boost provider not configured on Verxor.";
  }
  if (res.status >= 500) {
    return `Verxor upstream error (HTTP ${res.status}). Retry shortly.`;
  }
  if (rawText && !rawText.trim().startsWith("<")) {
    return rawText.trim().slice(0, 220);
  }
  return `Boost order failed at provider (HTTP ${res.status || "unknown"})`;
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

  // Prefer warm cache to avoid double JAP catalog fetch timeouts at checkout.
  const { data: catalogSnapshot } = await getAuthoritativeCatalog({
    forceRefresh: false,
    allowStale: false,
  });

  let catalogServices = catalogSnapshot?.services || [];
  if (!catalogServices.length) {
    const refreshed = await getAuthoritativeCatalog({
      forceRefresh: true,
      allowStale: false,
    });
    catalogServices = refreshed.data?.services || [];
  }

  if (!catalogServices.length) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Verxor could not confirm a fresh service catalog. Your wallet was not debited. Please try again shortly.",
      },
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

  const ratePer1000 = panelRetailRatePer1000(wholesaleUsd);
  const priceNgn = orderAmountNgn(ratePer1000, quantity);

  if (!Number.isFinite(priceNgn) || priceNgn < 1) {
    return NextResponse.json({ ok: false, error: "Invalid order amount calculation" }, { status: 400 });
  }

  const admin = createServerClient();
  const ref = `boost-${user.id.slice(0, 8)}-${Date.now()}`;
  const japServiceId = Number(service.providerId) || Number(service.id);

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

  let txnId: string | null = null;
  try {
    const { data: row } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        kind: "boost",
        title: `Boost — ${serviceTitle} × ${quantity.toLocaleString("en-NG")}`,
        amount: -priceNgn,
        status: "pending",
        meta: {
          ref,
          serviceId: service.id,
          providerId: japServiceId,
          serviceTitle,
          platform: service.platform,
          platformName: service.platformName,
          speed: service.speed || "",
          link,
          quantity,
          ratePer1000,
          wholesaleUsd,
          priceNgn,
          providerStatus: "pending",
        },
      })
      .select("id")
      .maybeSingle();
    if (row?.id) txnId = String(row.id);
  } catch {
    /* optional ledger */
  }

  try {
    const res = await verxorFetch("/boost", {
      method: "POST",
      body: JSON.stringify({
        serviceId: String(japServiceId),
        link,
        quantity,
        ref,
        retailPriceNgn: priceNgn,
        customerPaidNgn: priceNgn,
        customerEmail: customerEmail || undefined,
        customerName: customerName || undefined,
      }),
    });

    const { data, rawText } = await readUpstream(res);

    if (!res.ok || data.ok === false) {
      const errMsg = upstreamErrorMessage(res, data, rawText);
      console.error("[boost/order] Verxor rejected", {
        ref,
        status: res.status,
        error: errMsg,
        rawSlice: rawText.slice(0, 300),
      });

      try {
        if (txnId) {
          await admin
            .from("transactions")
            .update({
              status: "failed",
              meta: {
                ref,
                serviceId: service.id,
                providerId: japServiceId,
                serviceTitle,
                platform: service.platform,
                platformName: service.platformName,
                link,
                quantity,
                priceNgn,
                providerStatus: "failed",
                failureReason: errMsg,
                upstreamStatus: res.status,
              },
            })
            .eq("id", txnId);
        } else {
          await admin
            .from("transactions")
            .update({
              status: "failed",
              meta: {
                ref,
                serviceId: service.id,
                providerId: japServiceId,
                serviceTitle,
                platform: service.platform,
                platformName: service.platformName,
                link,
                quantity,
                priceNgn,
                providerStatus: "failed",
                failureReason: errMsg,
              },
            })
            .eq("user_id", user.id)
            .eq("kind", "boost")
            .contains("meta", { ref });
        }
      } catch {
        /* optional ledger */
      }

      const refunded = await restoreWallet();

      try {
        await admin.from("transactions").insert({
          user_id: user.id,
          kind: "boost_refund",
          title: `Refund: Boost failed (${serviceTitle})`,
          amount: priceNgn,
          status: "completed",
          meta: { ref, reason: errMsg },
        });
      } catch {
        /* optional */
      }

      return NextResponse.json(
        { ok: false, error: errMsg, refunded, upstreamStatus: res.status },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
      );
    }

    const order = (data.order as Record<string, unknown>) || {};
    const providerOrderId = String(
      order.ref || order.providerOrderId || order.id || data.order || "",
    );
    const providerStatus = String(order.status || "processing").toLowerCase();

    try {
      const patch = {
        title: String(order.title || `Boost #${providerOrderId} — ${serviceTitle}`),
        status: "processing",
        meta: {
          ref,
          providerOrderId,
          serviceId: service.id,
          providerId: japServiceId,
          serviceTitle,
          platform: service.platform,
          platformName: service.platformName,
          speed: service.speed || "",
          link,
          quantity,
          ratePer1000,
          wholesaleUsd,
          priceNgn,
          providerStatus,
          wholesaleCharged: data.balanceDebited,
          walletMode: data.walletMode,
        },
      };
      if (txnId) {
        await admin.from("transactions").update(patch).eq("id", txnId);
      } else {
        const transactionUpdate = await admin
          .from("transactions")
          .update(patch)
          .eq("user_id", user.id)
          .eq("kind", "boost")
          .contains("meta", { ref })
          .select("id");
        if (transactionUpdate.error || !transactionUpdate.data?.length) {
          await admin.from("transactions").insert({
            user_id: user.id,
            kind: "boost",
            title: patch.title,
            amount: -priceNgn,
            status: "processing",
            meta: patch.meta,
          });
        }
      }
    } catch {
      /* optional */
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: providerOrderId,
        providerOrderId,
        status: providerStatus || "processing",
        serviceId: service.id,
        serviceTitle,
        platform: service.platform,
        platformName: service.platformName,
        link,
        quantity,
        amount: priceNgn,
        ratePer1000,
        message:
          String(order.message || "") ||
          `Boost order placed successfully (${quantity.toLocaleString("en-NG")})`,
        provider: "smm",
        priceMode: "retail",
      },
      balanceDebited: priceNgn,
      balance: newBal,
    });
  } catch (e: unknown) {
    console.error("[boost/order] Provider outcome needs verification", { ref, error: e });
    try {
      if (txnId) {
        await admin
          .from("transactions")
          .update({
            status: "processing",
            meta: {
              ref,
              serviceId: service.id,
              providerId: japServiceId,
              serviceTitle,
              platform: service.platform,
              platformName: service.platformName,
              link,
              quantity,
              priceNgn,
              ratePer1000,
              wholesaleUsd,
              providerStatus: "processing",
              needsVerification: true,
            },
          })
          .eq("id", txnId);
      }
    } catch {
      /* optional */
    }
    return NextResponse.json(
      {
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
          message:
            "Your order is being verified. Please don't submit it again; check your order history shortly.",
          provider: "smm",
          priceMode: "retail",
        },
        balanceDebited: priceNgn,
        balance: newBal,
        reference: ref,
      },
      { status: 202 },
    );
  }
}
