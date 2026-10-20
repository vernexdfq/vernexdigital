import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PANEL_SLUG = "vernexdigital";
const ACCOUNT_NAME = "Verxor-vernexdigital";
const MIN_AMOUNT = 500;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const isDebug = body.debug === true;

    if (!isDebug) {
      const amount = Math.round(Number(body.amount));
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

    const { configured } = verxorConfig();
    if (!configured) {
      return NextResponse.json(
        {
          error:
            "VERXOR_PANEL_API_KEY is not set. Add the vx_panel_* key from Verxor only.",
        },
        { status: 503 },
      );
    }

    const amount = isDebug ? 0 : Math.round(Number(body.amount));
    const payload = isDebug ? {} : { amount };

    // ping has multi-bank fallback + real email (same merchant as customer funding)
    const res = await verxorFetch("/partner/fund/ping", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const text = await res.text().catch(() => "");
    let data: Record<string, unknown> = {};
    const looksLikeHtml =
      text.includes("<!DOCTYPE") ||
      text.includes("<html") ||
      (text.toLowerCase().includes("bad gateway") && !text.trim().startsWith("{"));

    if (looksLikeHtml) {
      return NextResponse.json(
        {
          error:
            "Verxor payment service temporarily unavailable (gateway). Retry in 30–60 seconds.",
        },
        { status: 502 },
      );
    }

    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: `Unexpected response from Verxor: ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }

    if (isDebug) {
      return NextResponse.json({
        ok: data.ok === true,
        source: "verxor-only",
        merchant: "verxor",
        debug: data,
        httpStatus: res.status,
      });
    }

    const accountNumber = String(data.accountNumber || "").replace(/\D/g, "");
    if (!accountNumber) {
      const errors = Array.isArray(data.errors) ? data.errors.map(String) : [];
      const msg =
        (typeof data.message === "string" && data.message) ||
        errors.join("; ") ||
        `Could not create account (HTTP ${res.status}).`;
      console.error("[partner-fund] no account", res.status, text.slice(0, 600));
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      amount: Number(data.amount) || amount,
      bankName: data.bankName || "OPay",
      accountNumber,
      accountName: data.accountName || ACCOUNT_NAME,
      reservedAccountId: data.reservedAccountId || null,
      expireAt: data.expireAt || null,
      externalReference: data.externalReference || data.externalRef || null,
      message:
        "Transfer the exact amount. Money settles to Verxor; panel balance credits when the bank confirms.",
      panelSlug: PANEL_SLUG,
      source: "verxor",
      merchant: "verxor",
    });
  } catch (e) {
    console.error("[partner-fund]", e);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Could not create funding account",
      },
      { status: 500 },
    );
  }
}
