import type { SupabaseClient } from "@supabase/supabase-js";

/** Credit partner_wallets when XixaPay confirms a partner_* session. Returns result or null if not partner. */
export async function tryCreditPartnerWholesale(
  admin: SupabaseClient,
  opts: {
    externalRef: string;
    accountNumber: string;
    amountPaid: number;
    transactionId: string;
  },
): Promise<{ credited: number; balance: number; panelSlug: string } | null> {
  const { externalRef, accountNumber, amountPaid, transactionId } = opts;

  let partnerSession: {
    id: string;
    panel_slug: string;
    amount: number;
    status: string;
  } | null = null;

  if (externalRef && externalRef.startsWith("partner_")) {
    const { data } = await admin
      .from("partner_fund_sessions")
      .select("id, panel_slug, amount, status")
      .eq("external_ref", externalRef)
      .maybeSingle();
    if (data) partnerSession = data as typeof partnerSession;
  }

  if (!partnerSession && accountNumber) {
    const { data: rows } = await admin
      .from("partner_fund_sessions")
      .select("id, panel_slug, amount, status")
      .eq("account_number", accountNumber)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);
    if (rows?.[0]) partnerSession = rows[0] as typeof partnerSession;
  }

  if (!partnerSession || partnerSession.status !== "pending") return null;

  const credit =
    amountPaid > 0
      ? amountPaid
      : Number(partnerSession.amount) > 0
        ? Number(partnerSession.amount)
        : 0;
  if (!(credit > 0)) return null;

  const slug = partnerSession.panel_slug || "vernexdigital";
  const { data: wallet } = await admin
    .from("partner_wallets")
    .select("balance")
    .eq("panel_slug", slug)
    .maybeSingle();

  const current = wallet?.balance != null ? Number(wallet.balance) : 0;
  const next = Math.round((current + credit) * 100) / 100;

  await admin.from("partner_wallets").upsert(
    {
      panel_slug: slug,
      balance: next,
      currency: "NGN",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "panel_slug" },
  );

  await admin
    .from("partner_fund_sessions")
    .update({
      status: "paid",
      meta: {
        webhook_credited_at: new Date().toISOString(),
        amount_paid: credit,
        gateway_transaction_id: transactionId || null,
      },
    })
    .eq("id", partnerSession.id)
    .eq("status", "pending");

  return { credited: credit, balance: next, panelSlug: slug };
}
