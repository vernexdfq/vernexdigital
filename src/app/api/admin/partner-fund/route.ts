import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createDynamicVirtualAccount, getXixaPayConfig } from "@/lib/xixapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PANEL_SLUG = "vernexdigital";
const ACCOUNT_NAME = "Verxor–vernexdigital";

/**
 * Partner / child-panel wholesale top-up.
 * Account name is always Verxor–vernexdigital (never a personal name).
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

    if (!getXixaPayConfig()) {
      return NextResponse.json(
        {
          error:
            "Payment gateway is not configured. Add XIXAPAY_* env vars, then retry.",
        },
        { status: 503 },
      );
    }

    const externalReference = `partner_${PANEL_SLUG}_${Date.now()}`;
    const callbackUrl =
      process.env.XIXAPAY_VIRTUAL_ACCOUNT_WEBHOOK_URL ||
      "https://www.vernexdigital.com/api/webhooks/xixapay/virtual-account";

    const va = await createDynamicVirtualAccount({
      email: `partner-${PANEL_SLUG}@vernexdigital.com`,
      name: ACCOUNT_NAME,
      phoneNumber: "08000000000",
      amount,
      externalReference,
      callbackUrl,
    });

    const accountName = ACCOUNT_NAME;

    try {
      const admin = createServerClient();
      await admin.from("partner_fund_sessions").insert({
        panel_slug: PANEL_SLUG,
        amount,
        status: "pending",
        bank_name: va.bankName,
        account_number: String(va.accountNumber).replace(/\D/g, ""),
        account_name: accountName,
        external_ref: externalReference,
        reserved_account_id: va.reservedAccountId || null,
        expire_at: va.expireAt,
        meta: {
          provider: "xixapay",
          account_type: "partner_wholesale",
        },
      });
    } catch (e) {
      console.warn("[partner-fund] session insert skipped", e);
    }

    return NextResponse.json({
      ok: true,
      amount: va.amount,
      bankName: va.bankName,
      accountNumber: va.accountNumber,
      accountName,
      reservedAccountId: va.reservedAccountId,
      expireAt: va.expireAt,
      externalReference,
      message:
        "Transfer the exact amount. Panel wholesale balance updates when the bank confirms.",
    });
  } catch (e) {
    console.error("[partner-fund]", e);
    const message =
      e instanceof Error ? e.message : "Could not create funding account";
    if (message === "XIXAPAY_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Payment gateway is not configured." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
