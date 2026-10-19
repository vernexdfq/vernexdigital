import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PANEL_SLUG = "vernexdigital";
const ACCOUNT_NAME = "Verxor–vernexdigital";

/**
 * Partner wholesale top-up via Verxor only (Verxor's XixaPay).
 * No local XixaPay — panel API key authenticates to Verxor.
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
            "VERXOR_PANEL_API_KEY is not set on vernexdigital. Add it in Vercel env, then redeploy.",
        },
        { status: 503 },
      );
    }

    const res = await verxorFetch("/partner/fund/generate", {
      method: "POST",
      body: JSON.stringify({
        amount,
        amountNgn: amount,
        name: ACCOUNT_NAME,
        email: `partner-${PANEL_SLUG}@verxor.local`,
      }),
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

    const account = data.account || data;
    return NextResponse.json({
      ok: true,
      amount: Number(account.amountNgn ?? account.amount ?? amount),
      bankName: account.bankName || "OPay",
      accountNumber: String(account.accountNumber || ""),
      accountName: account.accountName || ACCOUNT_NAME,
      reservedAccountId: account.providerId || null,
      expireAt: account.expireAt || null,
      externalReference: account.externalRef || null,
      message:
        "Transfer the exact amount. Panel wholesale balance updates on Verxor when the bank confirms.",
    });
  } catch (e) {
    console.error("[partner-fund]", e);
    const message =
      e instanceof Error ? e.message : "Could not create funding account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
