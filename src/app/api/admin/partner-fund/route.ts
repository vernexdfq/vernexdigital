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

    const text = await res.text().catch(() => "");
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { raw: text.slice(0, 400) };
    }

    if (!res.ok || data.ok === false) {
      const msg =
        (typeof data.message === "string" && data.message) ||
        (typeof data.error === "string" && data.error) ||
        (typeof data.reason === "string" && data.reason) ||
        (typeof data.raw === "string" && data.raw) ||
        `Could not create funding account on Verxor (HTTP ${res.status}).`;
      console.error("[partner-fund] Verxor error", res.status, text.slice(0, 500));
      return NextResponse.json(
        { error: msg },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      amount: Number(data.amountNgn ?? data.amount) || amount,
      bankName: data.bankName || (data.account as any)?.bankName || "OPay",
      accountNumber: String(
        data.accountNumber || (data.account as any)?.accountNumber || "",
      ).replace(/\D/g, ""),
      accountName:
        data.accountName || (data.account as any)?.accountName || ACCOUNT_NAME,
      reservedAccountId: data.reservedAccountId || null,
      expireAt: data.expireAt || (data.account as any)?.expireAt || null,
      externalReference:
        data.externalReference ||
        data.externalRef ||
        (data.account as any)?.externalRef ||
        null,
      message:
        (typeof data.message === "string" && data.message) ||
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
