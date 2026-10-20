import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PANEL_SLUG = "vernexdigital";
const ACCOUNT_NAME = "Verxor-vernexdigital";
const BANK = { code: "100004", name: "OPay" };
const MIN_AMOUNT = 500;

function xixapayEnv() {
  const apiKey = (
    process.env.XIXAPAY_API_KEY ||
    process.env.VERXOR_XIXAPAY_API_KEY ||
    process.env.VERXOR_XIXAPAY_API ||
    ""
  ).trim();
  const secret = (
    process.env.XIXAPAY_SECRET_KEY ||
    process.env.VERXOR_XIXAPAY_SECRET_KEY ||
    process.env.VERXOR_XIXAPAY_SECRET ||
    ""
  ).trim();
  const businessId = (
    process.env.XIXAPAY_BUSINESS_ID ||
    process.env.VERXOR_XIXAPAY_BUSINESS_ID ||
    ""
  ).trim();
  const base = (
    process.env.XIXAPAY_BASE_URL ||
    process.env.VERXOR_XIXAPAY_BASE_URL ||
    "https://api.xixapay.com"
  ).replace(/\/$/, "");
  return {
    apiKey,
    secret,
    businessId,
    base,
    configured: Boolean(apiKey && secret && businessId),
  };
}

function pickAccount(raw: Record<string, unknown>) {
  const data = (raw?.data as Record<string, unknown>) || raw;
  const bankAccounts = (data.bankAccounts ||
    data.accounts ||
    raw.bankAccounts ||
    []) as Array<Record<string, unknown>>;
  const first = bankAccounts[0] || {};
  const customer = (data.customer || raw.customer || {}) as Record<
    string,
    unknown
  >;

  const accountNumber = String(
    first.accountNumber ||
      first.account_number ||
      data.accountNumber ||
      data.account_number ||
      data.virtualAccountNumber ||
      "",
  ).replace(/\D/g, "");

  const accountName = String(
    first.accountName ||
      first.account_name ||
      data.accountName ||
      data.account_name ||
      "",
  );
  const bankName = String(
    first.bankName ||
      first.bank_name ||
      data.bankName ||
      data.bank_name ||
      BANK.name,
  );
  const providerCustomerId = String(
    customer.customer_id || customer.id || data.customer_id || data.customerId || "",
  );
  const expireAt =
    first.expire_at || first.expireAt || data.expire_at || data.expireAt || null;

  return { accountNumber, accountName, bankName, providerCustomerId, expireAt };
}

/**
 * Partner top-up.
 *
 * Prefer local XixaPay (XIXAPAY_* or VERXOR_XIXAPAY_* on vernexdigital Vercel),
 * then register the VA on Verxor so the webhook credits reseller_wallet.
 * Falls back to Verxor /partner/fund/generate if local keys are missing.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const isDebug = body.debug === true;

    const amount = Math.round(Number(body.amount));
    if (!isDebug) {
      if (!Number.isFinite(amount) || amount < MIN_AMOUNT) {
        return NextResponse.json(
          { error: `Minimum panel top-up is ₦${MIN_AMOUNT}.` },
          { status: 400 },
        );
      }
      if (amount > 5_000_000) {
        return NextResponse.json({ error: "Amount is too large." }, { status: 400 });
      }
    }

    const local = xixapayEnv();
    const { configured: verxorConfigured } = verxorConfig();

    if (isDebug) {
      return NextResponse.json({
        ok: true,
        debug: true,
        localXixapay: local.configured,
        verxorPanelKey: verxorConfigured,
        message: local.configured
          ? "Local XixaPay configured — will generate OPay on vernexdigital."
          : verxorConfigured
            ? "No local XixaPay; will proxy to Verxor generate."
            : "Neither local XixaPay nor VERXOR_PANEL_API_KEY is set.",
      });
    }

    // ── Path A: generate on vernexdigital with local XixaPay keys ──────────
    if (local.configured) {
      const externalRef = `vxp-panel-vernex-${Date.now()}`;
      const callbackUrl =
        process.env.XIXAPAY_VIRTUAL_ACCOUNT_WEBHOOK_URL ||
        process.env.VERXOR_XIXAPAY_WEBHOOK_URL ||
        "https://www.verxor.com/api/webhooks/xixapay/virtual-account";

      const payload = {
        email: "vernexdigital@gmail.com",
        name: ACCOUNT_NAME,
        phoneNumber: "08000000000",
        bankCode: [BANK.code],
        businessId: local.businessId,
        accountType: "dynamic",
        amount,
        externalReference: externalRef,
        callbackUrl,
      };

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15_000);

      let xixapayRes: Response;
      try {
        xixapayRes = await fetch(`${local.base}/api/v1/createVirtualAccount`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${local.secret}`,
            "api-key": local.apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          cache: "no-store",
          signal: controller.signal,
        });
      } catch (e) {
        clearTimeout(timer);
        const aborted = e instanceof Error && e.name === "AbortError";
        console.error("[partner-fund] local xixapay network", e);
        return NextResponse.json(
          {
            error: aborted
              ? "Payment provider timed out. Try again."
              : "Could not reach payment provider. Try again.",
          },
          { status: 502 },
        );
      } finally {
        clearTimeout(timer);
      }

      const rawText = await xixapayRes.text().catch(() => "");
      let raw: Record<string, unknown> = {};
      try {
        raw = JSON.parse(rawText) as Record<string, unknown>;
      } catch {
        raw = { raw: rawText.slice(0, 300) };
      }

      if (
        !xixapayRes.ok ||
        raw.status === "fail" ||
        String(raw.message || "").includes("API Key is not active")
      ) {
        console.error(
          "[partner-fund] local xixapay error",
          xixapayRes.status,
          rawText.slice(0, 500),
        );
        const msg =
          (typeof raw.message === "string" && raw.message) ||
          (typeof raw.error === "string" && raw.error) ||
          `Provider error (${xixapayRes.status})`;
        return NextResponse.json({ error: String(msg) }, { status: 502 });
      }

      const picked = pickAccount(raw);
      if (!picked.accountNumber) {
        return NextResponse.json(
          { error: "Provider returned no account number. Try again." },
          { status: 502 },
        );
      }

      const bankName = picked.bankName || BANK.name;
      const accountNumber = picked.accountNumber;
      const displayName = ACCOUNT_NAME;
      const expireAt = picked.expireAt ? String(picked.expireAt) : null;

      // Register on Verxor so webhook credits panel reseller_wallet
      if (verxorConfigured) {
        try {
          await verxorFetch("/partner/fund/register-va", {
            method: "POST",
            body: JSON.stringify({
              accountNumber,
              bankName,
              accountName: displayName,
              amountNgn: amount,
              externalRef,
              externalReference: externalRef,
              reservedAccountId: picked.providerCustomerId || null,
              expireAt,
            }),
          });
        } catch (e) {
          console.error("[partner-fund] register-va failed (non-fatal)", e);
        }
      }

      return NextResponse.json({
        ok: true,
        amount,
        bankName,
        accountNumber,
        accountName: displayName,
        reservedAccountId: picked.providerCustomerId || null,
        expireAt,
        externalReference: externalRef,
        message:
          "Transfer the exact amount. Panel balance updates when the bank confirms.",
        panelSlug: PANEL_SLUG,
        source: "local-xixapay",
      });
    }

    // ── Path B: proxy to Verxor (needs VERXOR_PANEL_API_KEY only) ─────────
    if (!verxorConfigured) {
      return NextResponse.json(
        {
          error:
            "Add XIXAPAY_API_KEY, XIXAPAY_SECRET_KEY, XIXAPAY_BUSINESS_ID (or VERXOR_XIXAPAY_*) on vernexdigital Vercel, or set VERXOR_PANEL_API_KEY to use Verxor generate.",
        },
        { status: 503 },
      );
    }

    const res = await verxorFetch("/partner/fund/generate", {
      method: "POST",
      body: JSON.stringify({ amountNgn: amount, amount }),
    });

    const text = await res.text().catch(() => "");
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      if (
        text.includes("502") ||
        text.includes("Bad gateway") ||
        text.includes("<!DOCTYPE")
      ) {
        data = {
          message:
            "Verxor payment service is temporarily unavailable (502). Add XIXAPAY_* env on vernexdigital to generate accounts locally.",
        };
      } else {
        data = { raw: text.slice(0, 400) };
      }
    }

    if (!res.ok || data.ok === false) {
      const msg =
        (typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        `Could not create funding account (HTTP ${res.status}).`;
      console.error("[partner-fund] Verxor error", res.status, text.slice(0, 500));
      return NextResponse.json(
        { error: msg },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      amount: Number(data.amountNgn ?? data.amount) || amount,
      bankName: data.bankName || "OPay",
      accountNumber: String(data.accountNumber || "").replace(/\D/g, ""),
      accountName: data.accountName || ACCOUNT_NAME,
      reservedAccountId: data.reservedAccountId || null,
      expireAt: data.expireAt || null,
      externalReference:
        data.externalReference || data.externalRef || null,
      message:
        (typeof data.message === "string" && data.message) ||
        "Transfer the exact amount. Panel balance updates when the bank confirms.",
      panelSlug: PANEL_SLUG,
      source: "verxor",
    });
  } catch (e) {
    console.error("[partner-fund]", e);
    const message =
      e instanceof Error ? e.message : "Could not create funding account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
