import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PANEL_SLUG = "vernexdigital";
const ACCOUNT_NAME = "Verxor-vernexdigital";
const MIN_AMOUNT = 500;

/**
 * Partner wholesale top-up — Grizzly-style.
 *
 * Child panel uses ONLY VERXOR_PANEL_API_KEY (vx_panel_*).
 * VA is created on Verxor with Verxor's own XixaPay merchant keys.
 * Bank money settles to Verxor; webhook credits panel reseller_wallet.
 *
 * NEVER read XIXAPAY_* from vernexdigital env for this route — those keys
 * belong to the panel's end-customer payments and would send money to them.
 */
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
            "VERXOR_PANEL_API_KEY is not set. Add the vx_panel_* key from Verxor only — do not add XixaPay keys here.",
        },
        { status: 503 },
      );
    }

    const payload = isDebug
      ? { debug: true }
      : {
          amountNgn: Math.round(Number(body.amount)),
          amount: Math.round(Number(body.amount)),
        };

    const res = await verxorFetch("/partner/fund/generate", {
      method: "POST",
      body: JSON.stringify(payload),
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
            "Verxor payment service temporarily unavailable. Retry in 30–60 seconds.",
        };
      } else {
        data = { raw: text.slice(0, 400) };
      }
    }

    if (isDebug) {
      return NextResponse.json({
        ok: data.ok === true,
        source: "verxor-only",
        usesLocalXixapay: false,
        debug: data,
        httpStatus: res.status,
        message:
          "Partner fund always uses Verxor XixaPay (your merchant). Panel only needs VERXOR_PANEL_API_KEY.",
      });
    }

    if (!res.ok || data.ok === false) {
      const msg =
        (typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        `Could not create funding account on Verxor (HTTP ${res.status}).`;
      console.error("[partner-fund] Verxor error", res.status, text.slice(0, 500));
      return NextResponse.json(
        { error: msg },
        { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      amount: Number(data.amountNgn ?? data.amount) || Math.round(Number(body.amount)),
      bankName: data.bankName || "OPay",
      accountNumber: String(data.accountNumber || "").replace(/\D/g, ""),
      accountName: data.accountName || ACCOUNT_NAME,
      reservedAccountId: data.reservedAccountId || null,
      expireAt: data.expireAt || null,
      externalReference: data.externalReference || data.externalRef || null,
      message:
        (typeof data.message === "string" && data.message) ||
        "Transfer the exact amount. Money settles to Verxor; your panel wholesale balance credits when the bank confirms.",
      panelSlug: PANEL_SLUG,
      source: "verxor",
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
