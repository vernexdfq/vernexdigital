import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PANEL_SLUG = "vernexdigital";
const ACCOUNT_NAME = "Verxor-vernexdigital";
const MIN_AMOUNT = 500;

/**
 * Partner wholesale top-up — only VERXOR_PANEL_API_KEY.
 * VA on Verxor merchant XixaPay → money to you; webhook credits panel balance.
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
            "VERXOR_PANEL_API_KEY is not set. Add the vx_panel_* key from Verxor only.",
        },
        { status: 503 },
      );
    }

    const payload = isDebug ? {} : { amount: Math.round(Number(body.amount)) };

    const res = await verxorFetch("/partner/fund/ping", {
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
        (typeof data.providerMessage === "string" && data.providerMessage) ||
        `Could not create OPay account (HTTP ${res.status}).`;
      console.error("[partner-fund] no account", res.status, text.slice(0, 600));
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      amount: Number(data.amount) || Math.round(Number(body.amount)),
      bankName: data.bankName || "OPay",
      accountNumber,
      accountName: data.accountName || ACCOUNT_NAME,
      reservedAccountId: data.reservedAccountId || null,
      expireAt: data.expireAt || null,
      externalReference: data.externalReference || null,
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
