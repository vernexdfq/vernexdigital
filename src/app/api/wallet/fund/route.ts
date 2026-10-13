import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { createDynamicVirtualAccount, getXixaPayConfig } from "@/lib/xixapay";

export const runtime = "nodejs";

async function getAuthedUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function POST(req: NextRequest) {
  try {
    if (!getXixaPayConfig()) {
      return NextResponse.json(
        { error: "Payment gateway is not configured. Add XIXAPAY_* env vars." },
        { status: 503 }
      );
    }

    const user = await getAuthedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in again to fund your wallet." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = Math.round(Number(body.amount));
    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        { error: "Minimum funding amount is ₦100." },
        { status: 400 }
      );
    }
    if (amount > 5_000_000) {
      return NextResponse.json({ error: "Amount is too large." }, { status: 400 });
    }

    const admin = createServerClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", user.id)
      .maybeSingle();

    const email = profile?.email || user.email || `user-${user.id.slice(0, 8)}@vernexdigital.com`;
    const name =
      (profile?.full_name && String(profile.full_name).trim()) ||
      email.split("@")[0] ||
      "Vernex User";
    const phone = (profile?.phone && String(profile.phone)) || "08000000000";

    const externalReference = `fund_${user.id.replace(/-/g, "").slice(0, 12)}_${Date.now()}`;
    const callbackUrl =
      process.env.XIXAPAY_VIRTUAL_ACCOUNT_WEBHOOK_URL ||
      "https://vernexdigital.com/api/webhooks/xixapay/virtual-account";

    const va = await createDynamicVirtualAccount({
      email,
      name,
      phoneNumber: phone,
      amount,
      externalReference,
      callbackUrl,
    });

    const { data: tx, error: txError } = await admin
      .from("transactions")
      .insert({
        user_id: user.id,
        kind: "wallet_fund",
        title: `Fund wallet ₦${amount.toLocaleString("en-NG")}`,
        amount,
        status: "pending",
        meta: {
          provider: "xixapay",
          account_type: "dynamic",
          bank_name: va.bankName,
          account_number: va.accountNumber,
          account_name: va.accountName,
          reserved_account_id: va.reservedAccountId,
          customer_id: va.customerId,
          external_reference: externalReference,
          expire_at: va.expireAt,
        },
      })
      .select("id")
      .single();

    if (txError) {
      console.error("[wallet/fund] tx insert", txError);
    }

    return NextResponse.json({
      ok: true,
      transactionId: tx?.id || null,
      amount: va.amount,
      bankName: va.bankName,
      accountNumber: va.accountNumber,
      accountName: va.accountName,
      reservedAccountId: va.reservedAccountId,
      expireAt: va.expireAt,
      externalReference,
      message: "Transfer the exact amount to this account. Your wallet will update automatically.",
    });
  } catch (e) {
    console.error("[wallet/fund]", e);
    const message = e instanceof Error ? e.message : "Could not create funding account";
    if (message === "XIXAPAY_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Payment gateway is not configured." }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
