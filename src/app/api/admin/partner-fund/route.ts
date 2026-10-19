import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PANEL_SLUG = "vernexdigital";
const ACCOUNT_NAME = "Verxor–vernexdigital";

/**
 * Partner top-up via Verxor only (single XixaPay lives on Verxor).
 * Child panel never needs XIXAPAY_* — only VERXOR_PANEL_API_KEY.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const amount = Math.round(Number(body.amount));
    if (!Number.isFinite(amount) || amount < 500) {
      return NextResponse.json(
        { error: "Minimum panel top-up is ₦500." },
        { status: 400 },
      );
    }
    if (amount > 5_000_000) {
      return NextResponse.json({ error: "Amount is too large." }, { status: 400 });
    }

    const { configured } = verxorConfig();
    if (!configured) {
      return NextResponse.json(
        {
          error:
            "VERXOR_PANEL_API_KEY is not set. Add it on vernexdigital Vercel, then retry.",
        },
        { status: 503 },
      );
    }

    const res = await verxorFetch("/partner/fund/generate", {
      method: "POST",
      body: JSON.stringify({ amountNgn: amount, amount }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        {
          error:
            data.message ||
            data.error ||
            data.reason ||
            "Could not create funding account on Verxor.",
        },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      amount: Number(data.amountNgn ?? data.amount) || amount,
      bankName: data.bankName || data.account?.bankName || "OPay",
      accountNumber: String(
        data.accountNumber || data.account?.accountNumber || "",
      ).replace(/\D/g, ""),
      accountName:
        data.accountName || data.account?.accountName || ACCOUNT_NAME,
      reservedAccountId: data.reservedAccountId || null,
      expireAt: data.expireAt || data.account?.expireAt || null,
      externalReference:
        data.externalReference ||
        data.externalRef ||
        data.account?.externalRef ||
        null,
      message:
        data.message ||
        "Transfer the exact amount. Panel balance updates when the bank confirms.",
      panelSlug: PANEL_SLUG,
    });
  } catch (e) {
    console.error("[partner-fund]", e);
    const message =
      e instanceof Error ? e.message : "Could not create funding account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
