import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digitsOnly(s: string): string {
  return String(s || "").replace(/\D/g, "");
}

function isSuccessStatus(status: string, amountPaid: number): boolean {
  const s = status.toLowerCase();
  if (
    s.includes("success") ||
    s === "payment_successful" ||
    s === "successful" ||
    s === "completed" ||
    s === "paid" ||
    s === "successfull"
  ) {
    return true;
  }
  if (!s && amountPaid > 0) return true;
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({} as Record<string, unknown>));
    const status = String(
      payload.notification_status ||
        payload.transaction_status ||
        payload.status ||
        ""
    ).toLowerCase();

    const amountPaid = Number(
      payload.amount_paid ??
        payload.settlement_amount ??
        payload.paid_amount ??
        payload.transaction_amount ??
        payload.amount ??
        0
    );

    if (!isSuccessStatus(status, amountPaid)) {
      console.info("[xixapay webhook] ignored non-success", { status, amountPaid });
      return NextResponse.json({ ok: true, ignored: true, reason: "not_success", status });
    }

    const receiver = (payload.receiver as Record<string, unknown>) || {};
    const accountNumber = digitsOnly(
      String(
        receiver.account_number ||
          receiver.accountNumber ||
          payload.account_number ||
          payload.accountNumber ||
          payload.virtual_account_number ||
          ""
      )
    );
    const reservedId = String(
      payload.Reserved_Account_Id ||
        payload.reserved_account_id ||
        receiver.Reserved_Account_Id ||
        payload.transaction_id ||
        payload.transactionId ||
        ""
    );
    const externalRef = String(
      payload.external_reference ||
        payload.externalReference ||
        payload.reference ||
        payload.ref ||
        ""
    );
    const transactionId = String(
      payload.transaction_id || payload.transactionId || payload.id || reservedId || externalRef || ""
    );

    console.info("[xixapay webhook] payload keys", {
      status,
      amountPaid,
      accountNumber,
      reservedId: reservedId.slice(0, 24),
      externalRef: externalRef.slice(0, 40),
      transactionId: transactionId.slice(0, 40),
    });

    let admin;
    try {
      admin = createServerClient();
    } catch (e) {
      console.error("[xixapay webhook] supabase config", e);
      return NextResponse.json(
        { error: "supabase_not_configured", detail: e instanceof Error ? e.message : "config" },
        { status: 503 }
      );
    }

    let userId: string | null = null;
    let pendingTxId: string | null = null;
    let expectedAmount = 0;
    let matchMeta: Record<string, unknown> = {};

    if (accountNumber) {
      const { data: vaRows, error: vaErr } = await admin
        .from("virtual_accounts")
        .select("id, user_id, amount, status, external_ref, account_number")
        .eq("account_number", accountNumber)
        .order("created_at", { ascending: false })
        .limit(5);

      if (vaErr) {
        console.warn("[xixapay webhook] virtual_accounts lookup", vaErr.message);
      } else if (vaRows?.length) {
        const open =
          vaRows.find((r) => String(r.status) === "pending" || String(r.status) === "active") ||
          vaRows[0];
        if (open?.user_id) {
          userId = String(open.user_id);
          expectedAmount = Number(open.amount) || 0;
        }
      }
    }

    const { data: rows, error } = await admin
      .from("transactions")
      .select("id, user_id, amount, status, meta, created_at")
      .eq("kind", "wallet_fund")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[xixapay webhook] transactions query", error);
      if (!userId) {
        return NextResponse.json(
          {
            error: "db",
            detail: error.message,
            code: error.code,
            hint: error.hint,
          },
          { status: 500 }
        );
      }
    }

    const match = (rows || []).find((row) => {
      const meta = (row.meta || {}) as Record<string, unknown>;
      const metaAcc = digitsOnly(String(meta.account_number || ""));
      const metaRes = String(meta.reserved_account_id || "");
      const metaExt = String(meta.external_reference || "");
      if (accountNumber && metaAcc) {
        if (accountNumber === metaAcc) return true;
        if (accountNumber.length >= 8 && metaAcc.endsWith(accountNumber.slice(-8))) return true;
        if (metaAcc.length >= 8 && accountNumber.endsWith(metaAcc.slice(-8))) return true;
      }
      if (reservedId && metaRes && reservedId === metaRes) return true;
      if (externalRef && metaExt && externalRef === metaExt) return true;
      return false;
    });

    if (match) {
      userId = String(match.user_id);
      pendingTxId = String(match.id);
      expectedAmount = Number(match.amount) || expectedAmount;
      matchMeta =
        match.meta && typeof match.meta === "object"
          ? (match.meta as Record<string, unknown>)
          : {};
    }

    if (!userId) {
      console.warn("[xixapay webhook] no matching pending fund", {
        accountNumber,
        reservedId,
        externalRef,
        pendingCount: (rows || []).length,
      });
      return NextResponse.json({
        ok: true,
        matched: false,
        reason: "no_pending_match",
        accountNumber,
        pendingScanned: (rows || []).length,
      });
    }

    const credit =
      amountPaid > 0 ? amountPaid : expectedAmount > 0 ? expectedAmount : 0;
    if (!(credit > 0)) {
      return NextResponse.json({ ok: true, matched: true, credited: 0, reason: "zero_amount" });
    }

    if (transactionId) {
      const { data: existing } = await admin
        .from("transactions")
        .select("id")
        .eq("kind", "wallet_fund")
        .eq("status", "success")
        .filter("meta->>gateway_transaction_id", "eq", transactionId)
        .limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json({
          ok: true,
          matched: true,
          already_credited: true,
          transactionId,
        });
      }
    }

    if (pendingTxId) {
      await admin
        .from("transactions")
        .update({
          status: "success",
          meta: {
            ...matchMeta,
            webhook: payload,
            credited_at: new Date().toISOString(),
            amount_paid: credit,
            gateway_transaction_id: transactionId || null,
          },
        })
        .eq("id", pendingTxId)
        .eq("status", "pending");
    } else {
      await admin.from("transactions").insert({
        user_id: userId,
        kind: "wallet_fund",
        title: `Fund wallet ₦${credit.toLocaleString("en-NG")}`,
        amount: credit,
        status: "success",
        meta: {
          provider: "xixapay",
          webhook: payload,
          credited_at: new Date().toISOString(),
          amount_paid: credit,
          account_number: accountNumber || null,
          gateway_transaction_id: transactionId || null,
        },
      });
    }

    const { data: wallet, error: wErr } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (wErr) {
      console.error("[xixapay webhook] wallet read", wErr);
      return NextResponse.json(
        { error: "wallet_read_failed", detail: wErr.message },
        { status: 500 }
      );
    }

    const current = wallet?.balance != null ? Number(wallet.balance) : 0;
    const next = Math.round((current + credit) * 100) / 100;

    const { error: upErr } = await admin.from("wallets").upsert(
      {
        user_id: userId,
        balance: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upErr) {
      console.error("[xixapay webhook] wallet upsert", upErr);
      return NextResponse.json(
        { error: "wallet_credit_failed", detail: upErr.message },
        { status: 500 }
      );
    }

    if (accountNumber) {
      await admin
        .from("virtual_accounts")
        .update({ status: "used", updated_at: new Date().toISOString() })
        .eq("account_number", accountNumber)
        .eq("user_id", userId);
    }

    console.info("[xixapay webhook] credited", { userId, credit, next, transactionId });
    return NextResponse.json({
      ok: true,
      matched: true,
      userId,
      credited: credit,
      balance: next,
    });
  } catch (e) {
    console.error("[xixapay webhook]", e);
    return NextResponse.json(
      {
        error: "webhook_failed",
        detail: e instanceof Error ? e.message : "unknown",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "xixapay-virtual-account-webhook",
    host: "www.vernexdigital.com",
  });
}
