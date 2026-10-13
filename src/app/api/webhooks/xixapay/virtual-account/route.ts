import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * XixaPay reserved / dynamic account payment webhook.
 * Credits the matching pending wallet_fund transaction and user wallet.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const status = String(
      payload.notification_status || payload.transaction_status || payload.status || ""
    ).toLowerCase();

    const success =
      status.includes("success") ||
      status === "payment_successful" ||
      status === "successful" ||
      status === "completed";

    if (!success) {
      return NextResponse.json({ ok: true, ignored: true, reason: "not_success" });
    }

    const amountPaid = Number(
      payload.amount_paid ?? payload.settlement_amount ?? payload.amount ?? 0
    );
    const receiver = (payload.receiver as Record<string, unknown>) || {};
    const accountNumber = String(
      receiver.account_number || payload.account_number || payload.accountNumber || ""
    ).replace(/\D/g, "");
    const reservedId = String(
      payload.Reserved_Account_Id ||
        payload.reserved_account_id ||
        payload.transaction_id ||
        ""
    );
    const externalRef = String(
      payload.external_reference || payload.externalReference || payload.reference || ""
    );

    const admin = createServerClient();

    // Find pending fund transaction by account number or reserved id
    let query = admin
      .from("transactions")
      .select("id, user_id, amount, status, meta")
      .eq("kind", "wallet_fund")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: rows, error } = await query;
    if (error) {
      console.error("[xixapay webhook] query", error);
      return NextResponse.json({ error: "db" }, { status: 500 });
    }

    const match = (rows || []).find((row) => {
      const meta = (row.meta || {}) as Record<string, unknown>;
      const metaAcc = String(meta.account_number || "").replace(/\D/g, "");
      const metaRes = String(meta.reserved_account_id || "");
      const metaExt = String(meta.external_reference || "");
      if (accountNumber && metaAcc && accountNumber.endsWith(metaAcc.slice(-8))) return true;
      if (reservedId && metaRes && reservedId === metaRes) return true;
      if (externalRef && metaExt && externalRef === metaExt) return true;
      return false;
    });

    if (!match) {
      console.warn("[xixapay webhook] no matching pending fund", {
        accountNumber,
        reservedId,
        externalRef,
      });
      return NextResponse.json({ ok: true, matched: false });
    }

    const credit = amountPaid > 0 ? amountPaid : Number(match.amount);
    if (!(credit > 0)) {
      return NextResponse.json({ ok: true, matched: true, credited: 0 });
    }

    // Mark transaction success
    await admin
      .from("transactions")
      .update({
        status: "success",
        meta: {
          ...((match.meta as object) || {}),
          webhook: payload,
          credited_at: new Date().toISOString(),
          amount_paid: credit,
        },
      })
      .eq("id", match.id)
      .eq("status", "pending");

    // Credit wallet
    const { data: wallet } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", match.user_id)
      .maybeSingle();

    const current = wallet?.balance != null ? Number(wallet.balance) : 0;
    const next = Math.round((current + credit) * 100) / 100;

    await admin.from("wallets").upsert({
      user_id: match.user_id,
      balance: next,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      matched: true,
      userId: match.user_id,
      credited: credit,
      balance: next,
    });
  } catch (e) {
    console.error("[xixapay webhook]", e);
    return NextResponse.json({ error: "webhook_failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "xixapay-virtual-account-webhook" });
}
