import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { logsWholesaleNgn, logsRetailNgnFor } from "@/lib/logs-pricing";
import { getSharedLogsPricing } from "@/lib/logs-pricing-server";
import { buildLogsDownloadUrl } from "@/lib/logs-download";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function getUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !anon || !token) return null;
  const auth = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await auth.auth.getUser();
  return data.user || null;
}

async function changeWalletBalance(
  admin: ReturnType<typeof createServerClient>,
  userId: string,
  change: (balance: number) => number | null,
  attempts = 5,
): Promise<{ ok: boolean; balance?: number }> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const { data: wallet, error: readError } = await admin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (readError || !wallet) return { ok: false };
    const current = Number(wallet.balance) || 0;
    const next = change(current);
    if (next === null || !Number.isFinite(next) || next < 0) {
      return { ok: false, balance: current };
    }
    const rounded = Math.round(next * 100) / 100;
    const { data, error } = await admin
      .from("wallets")
      .update({ balance: rounded, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("balance", current)
      .select("balance");
    if (!error && data?.length) return { ok: true, balance: Number(data[0].balance) };
  }
  return { ok: false };
}

/**
 * POST /api/logs/buy
 * Verifies the listing against the parent catalogue server-side, debits the
 * customer's panel wallet at panel retail pricing, buys wholesale from Verxor
 * with the panel API key (the parent debits our reseller wallet), refunds on
 * failure and short delivery, then delivers credentials and saves to logs_orders.
 */
export async function POST(req: NextRequest) {
  if (!verxorConfig().configured) {
    return NextResponse.json({ ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." }, { status: 503 });
  }
  const user = await getUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to buy accounts." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const platform = String(body.platform || "").trim();
  const adId = Number(body.providerListingId);
  const qty = Number(body.quantity);
  if (!platform || !Number.isSafeInteger(adId) || adId <= 0) {
    return NextResponse.json({ ok: false, error: "Select a listing to continue." }, { status: 400 });
  }
  if (!Number.isSafeInteger(qty) || qty < 1 || qty > 10) {
    return NextResponse.json({ ok: false, error: "Quantity must be between 1 and 10." }, { status: 400 });
  }

  // Verify the listing, stock and parent price server-side. Client prices are never trusted.
  // Use fast cached catalog first (<10ms) to avoid rate limits and slow multi-second walks.
  let offer: Record<string, unknown> | null = null;
  try {
    const qs = new URLSearchParams({ platform });
    let catalogRes = await verxorFetch(`/accounts/catalog?${qs.toString()}`, { method: "GET" });
    let catalog = await catalogRes.json().catch(() => ({}));
    let opts: Record<string, unknown>[] = Array.isArray(catalog.offers) ? catalog.offers : [];
    offer = opts.find((o) => Number(o.providerListingId) === adId) ?? null;

    // Fallback: try one refresh if listing was not found in cache
    if (!offer) {
      catalogRes = await verxorFetch(`/accounts/catalog?platform=${encodeURIComponent(platform)}&refresh=1`, { method: "GET" });
      catalog = await catalogRes.json().catch(() => ({}));
      opts = Array.isArray(catalog.offers) ? catalog.offers : [];
      offer = opts.find((o) => Number(o.providerListingId) === adId) ?? null;
    }

    if (!catalogRes.ok || !catalog.ok || !offer || Number(offer.stock) < qty) {
      return NextResponse.json(
        { ok: false, error: "This listing is currently unavailable or out of stock. Please choose another listing." },
        { status: 409 },
      );
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Could not verify this listing with Verxor. Please try again." }, { status: 502 });
  }

  const parentUnitNgn = Math.round(Number(offer.priceNgn) || 0);
  if (parentUnitNgn <= 0) {
    return NextResponse.json({ ok: false, error: "This listing's price could not be confirmed. Refresh and try again." }, { status: 409 });
  }
  const wholesaleUnit = logsWholesaleNgn(parentUnitNgn);
  const retailUnit = logsRetailNgnFor(wholesaleUnit, (await getSharedLogsPricing()).retail);
  const retailTotal = retailUnit * qty;

  const admin = createServerClient();
  const ref = `logs_${crypto.randomUUID()}`;

  // Best-effort ledger trail for reconciliation.
  async function writeLedger(status: string, extra: Record<string, unknown> = {}) {
    try {
      await admin.from("transactions").insert({
        user_id: user.id,
        kind: "buy_logs",
        status,
        amount: -retailTotal,
        title: `Buy logs — ${platform}${status === "success" ? "" : ` (${status})`}`,
        meta: { ref, platform, providerListingId: adId, quantity: qty, retailUnit, wholesaleUnit, ...extra },
      });
    } catch {
      /* ledger is best-effort */
    }
  }

  const debit = await changeWalletBalance(admin, user.id, (b) => b - retailTotal);
  if (!debit.ok) {
    await writeLedger("rejected");
    return NextResponse.json({ ok: false, error: "Insufficient wallet balance. Fund your wallet first." }, { status: 402 });
  }

  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const customerName = typeof meta.full_name === "string" && meta.full_name.trim() ? meta.full_name.trim() : (user.email || "");

  let upstream: Response;
  let data: Record<string, any>;
  try {
    upstream = await verxorFetch("/accounts/buy", {
      method: "POST",
      body: JSON.stringify({
        platform,
        providerListingId: adId,
        quantity: qty,
        customerName,
        customerEmail: user.email || "",
        customerPaidNgn: retailTotal,
      }),
    });
    data = await upstream.json().catch(() => ({}));
  } catch {
    // A timed-out request may already have been purchased upstream. Never blind-refund.
    await writeLedger("pending", { stage: "upstream_timeout" });
    return NextResponse.json(
      { ok: false, pending: true, reference: ref, error: `The provider response timed out. Your wallet remains reserved while this is reconciled. Do not retry yet; contact support with reference ${ref}.` },
      { status: 202 },
    );
  }

  if (!upstream.ok || !data.ok) {
    if (data.code === "provider_timeout_unconfirmed") {
      await writeLedger("pending", { stage: "provider_timeout_unconfirmed", upstreamReference: String(data.reference || "") });
      return NextResponse.json(
        { ok: false, pending: true, reference: ref, error: "The purchase is still being confirmed with the provider. Your wallet was debited and any overcharge will be refunded automatically once confirmed. Keep reference " + ref + "." },
        { status: 202 },
      );
    }
    const refund = await changeWalletBalance(admin, user.id, (b) => b + retailTotal);
    if (!refund.ok) {
      await writeLedger("pending", { stage: "refund_reconciliation", reason: String(data.error || "") });
      return NextResponse.json(
        { ok: false, pending: true, reference: ref, error: "The purchase failed upstream and the refund needs reconciliation. Contact support with reference " + ref },
        { status: 202 },
      );
    }
    // Refund trail row — separate kind so earnings never counts it as a sale.
    try {
      await admin.from("transactions").insert({
        user_id: user.id,
        kind: "logs_refund",
        status: "success",
        amount: retailTotal,
        title: "Refund — Buy logs",
        meta: { ref, reason: String(data.error || "") },
      });
    } catch {
      /* best-effort */
    }
    return NextResponse.json({ ok: false, error: data.error || "Purchase failed at provider. Your wallet has been refunded." }, { status: 502 });
  }

  const credentials = Array.isArray(data.credentials) ? data.credentials.map((c: unknown) => String(c)) : [];
  const deliveredQty = Number(data.quantity) || credentials.length || qty;
  const shortQty = Math.max(0, qty - deliveredQty);
  let chargedTotal = retailTotal;
  if (shortQty > 0) {
    const refundShort = await changeWalletBalance(admin, user.id, (b) => b + retailUnit * shortQty);
    if (refundShort.ok) chargedTotal = retailTotal - retailUnit * shortQty;
  }
  const wholesaleTotal = Number(data.wholesale?.totalNgn) || wholesaleUnit * deliveredQty;
  const title = String(data.title || offer.title || "Accounts");
  const platformName = String(data.platform || platform);

  const insert = await admin.from("logs_orders").insert({
    user_id: user.id,
    platform: platformName,
    title,
    quantity: deliveredQty,
    unit_price_ngn: retailUnit,
    total_ngn: chargedTotal,
    wholesale_total_ngn: wholesaleTotal,
    credentials,
    status: "delivered",
    provider_order_id: data.orderId ? String(data.orderId) : null,
    client_reference: ref,
  }).select("id").maybeSingle();

  await writeLedger("success", { deliveredQty, chargedTotal, wholesaleTotal, panelCharge: wholesaleTotal, providerOrderId: data.orderId ? String(data.orderId) : null });

  const orderId = insert.data?.id ? String(insert.data.id) : ref;
  const downloadUrl = buildLogsDownloadUrl(orderId);

  // Send customer delivery email asynchronously (fire-and-forget, never breaks purchase)
  if (user.email && user.email.includes("@")) {
    const toEmail = user.email.trim();
    void (async () => {
      try {
        const fromAddress = "Vernex Digital <no-reply@vernexdigital.com>";
        const emailSubject = `Your ${platformName} accounts are delivered · #${orderId.slice(0, 8)}`;
        const credItemsHtml = credentials
          .map(
            (c: string) =>
              `<div style="padding:10px 14px;background:#0F172A;color:#38BDF8;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;border-radius:6px;margin-bottom:6px;word-break:break-all;">${c
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</div>`,
          )
          .join("");

        const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Your Accounts Are Delivered</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;background:#FFFFFF;border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 16px 40px -10px rgba(15,23,42,0.07);overflow:hidden;">
          <tr>
            <td style="height:5px;background:linear-gradient(90deg, #1877F2 0%, #00D4FF 100%);"></td>
          </tr>
          <tr>
            <td style="padding:28px 32px 20px 32px;border-bottom:1px solid #F1F5F9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;width:44px;">
                    <img src="https://vernexdigital.com/vernex-icon.jpg" alt="Vernex Digital" width="40" height="40" style="display:block;border-radius:10px;" />
                  </td>
                  <td style="vertical-align:middle;padding-left:12px;text-align:left;">
                    <span style="font-size:18px;font-weight:800;color:#0B1F4D;display:block;">Vernex Digital</span>
                    <span style="font-size:11px;font-weight:600;color:#64748B;">Order Delivered · Digital Goods</span>
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <span style="display:inline-block;padding:4px 10px;background-color:#F0FDF4;border:1px solid #DCFCE7;border-radius:100px;font-size:11px;font-weight:700;color:#16A34A;">
                      ✓ Delivered
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <h2 style="margin:0 0 10px;font-size:20px;font-weight:800;color:#0B1F4D;">
                Your ${platformName} accounts are ready
              </h2>
              <p style="margin:0 0 20px;font-size:14px;color:#334155;line-height:1.5;">
                Hello${customerName ? ` <strong>${customerName}</strong>` : ""}, your purchase has been processed and your accounts are delivered below.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin-bottom:24px;">
                <tr>
                  <td style="font-size:12px;color:#64748B;padding-bottom:6px;">Order Reference:</td>
                  <td style="font-size:12px;font-weight:700;color:#0B1F4D;text-align:right;padding-bottom:6px;">${orderId}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#64748B;padding-bottom:6px;">Platform:</td>
                  <td style="font-size:12px;font-weight:700;color:#0B1F4D;text-align:right;padding-bottom:6px;">${platformName}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#64748B;padding-bottom:6px;">Listing:</td>
                  <td style="font-size:12px;font-weight:700;color:#0B1F4D;text-align:right;padding-bottom:6px;">${title}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#64748B;padding-bottom:6px;">Quantity:</td>
                  <td style="font-size:12px;font-weight:700;color:#0B1F4D;text-align:right;padding-bottom:6px;">${deliveredQty}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#64748B;">Total Paid:</td>
                  <td style="font-size:13px;font-weight:800;color:#1877F2;text-align:right;">₦${chargedTotal.toLocaleString()}</td>
                </tr>
              </table>

              <div style="margin-bottom:24px;">
                <div style="font-size:13px;font-weight:700;color:#0B1F4D;margin-bottom:8px;">Delivered Credentials (Keep Private):</div>
                <div style="background:#020617;padding:14px;border-radius:12px;border:1px solid #1E293B;">
                  ${credItemsHtml}
                </div>
              </div>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto;">
                <tr>
                  <td style="border-radius:30px;background:#1877F2;text-align:center;">
                    <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" style="background:#1877F2;border:1px solid #1877F2;border-radius:30px;color:#FFFFFF;display:inline-block;font-size:14px;font-weight:700;padding:14px 32px;text-decoration:none;">
                      Download Credentials (.txt) &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:16px;margin-bottom:20px;">
                <div style="font-size:12px;font-weight:700;color:#92400E;margin-bottom:6px;">Usage & Security Guidelines:</div>
                <ul style="margin:0;padding-left:16px;font-size:12px;color:#78350F;line-height:1.6;">
                  <li><strong>Format:</strong> Credentials follow <code>login:password</code> or <code>login:password:email:2fa</code>.</li>
                  <li><strong>2FA Codes:</strong> If a 2FA secret key is included, generate your code at <a href="https://2fa.live" style="color:#B45309;">2fa.live</a> or Google Authenticator.</li>
                  <li><strong>24-Hour Replacement:</strong> Accounts are covered by a 24-hour guarantee for credentials invalid on first login. Contact support with reference #${orderId}.</li>
                </ul>
              </div>

              <p style="margin:0;font-size:12px;color:#64748B;">
                Need assistance? Contact us at <a href="mailto:support@vernexdigital.com" style="color:#1877F2;text-decoration:none;font-weight:600;">support@vernexdigital.com</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:#F8FAFC;border-top:1px solid #F1F5F9;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94A3B8;">
                Vernex Digital • support@vernexdigital.com • vernexdigital.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        let sent = false;
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: fromAddress, to: toEmail, subject: emailSubject, html: emailHtml }),
          }).catch(() => null);
          sent = Boolean(r && r.ok);
        }
        if (!sent) {
          await verxorFetch("/email/send", {
            method: "POST",
            body: JSON.stringify({ from: fromAddress, to: toEmail, subject: emailSubject, html: emailHtml }),
          }).catch(() => null);
        }
      } catch (e) {
        console.warn("[email] Customer delivery email failed:", e);
      }
    })();
  }

  return NextResponse.json({
    ok: true,
    warning: insert.error ? "Purchase accepted, but order history could not be saved. Save your credentials and contact support." : undefined,
    downloadUrl,
    order: {
      id: orderId,
      title,
      platform: platformName,
      quantity: deliveredQty,
      unitPriceNgn: retailUnit,
      totalNgn: chargedTotal,
      credentials,
      downloadUrl,
    },
  });
}
