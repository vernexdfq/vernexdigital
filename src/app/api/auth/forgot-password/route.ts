import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function maskEmail(em: string): string {
  const parts = em.split("@");
  if (parts.length !== 2) return em;
  const [name, domain] = parts;
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = String(body.email || body.identifier || "").trim();
    if (!rawInput) {
      return NextResponse.json({ error: "Enter your email address or phone number" }, { status: 400 });
    }

    const supabase = createServerClient();
    let targetEmail = "";
    let fullName = "";

    if (rawInput.includes("@")) {
      targetEmail = rawInput.toLowerCase();
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", targetEmail)
        .limit(1)
        .maybeSingle();
      if (data) {
        fullName = data.full_name || "";
      }
    } else {
      // Input is phone number
      const cleanPhone = rawInput.replace(/\D/g, "").slice(-11);
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .or(`phone.eq.${cleanPhone},phone.eq.0${cleanPhone.slice(-10)},phone.eq.234${cleanPhone.slice(-10)}`)
        .limit(1)
        .maybeSingle();
      if (data?.email) {
        targetEmail = data.email.toLowerCase();
        fullName = data.full_name || "";
      }
    }

    if (!targetEmail) {
      // Do not disclose whether account exists
      return NextResponse.json({
        ok: true,
        message: "If an account exists with this detail, a reset email has been sent.",
      });
    }

    // Determine site origin from request headers
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "vernexdigital.com";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const origin = `${proto}://${host}`;
    const redirectTo = `${origin}/reset-password`;

    // 1. Generate Supabase recovery link via Admin API
    let resetUrl = "";
    let fallbackToken = "";
    try {
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email: targetEmail,
        options: { redirectTo },
      });

      if (!linkError && linkData?.properties?.action_link) {
        resetUrl = linkData.properties.action_link;
        fallbackToken = linkData.properties.hashed_token || "";
      }
    } catch (e) {
      console.warn("generateLink warning:", e);
    }

    // Direct app reset URL fallback
    const directResetUrl = fallbackToken
      ? `${redirectTo}?token_hash=${encodeURIComponent(fallbackToken)}&email=${encodeURIComponent(targetEmail)}`
      : resetUrl || `${redirectTo}?email=${encodeURIComponent(targetEmail)}`;

    const effectiveResetUrl = resetUrl || directResetUrl;

    // 2. Dispatch branded email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    let emailSent = false;

    if (resendKey) {
      const from = process.env.RESEND_FROM || "Vernex Digital <no-reply@vernexdigital.com>";
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: targetEmail,
          subject: "Reset your Vernex Digital password",
          html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:500px;background:#FFFFFF;border-radius:20px;border:1px solid #DCE9FC;box-shadow:0 16px 40px rgba(15,23,42,0.06);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 28px 20px;border-bottom:1px solid #F1F5F9;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="background:#1877F2;border-radius:12px;width:42px;height:42px;text-align:center;vertical-align:middle;">
                    <span style="color:#FFFFFF;font-weight:900;font-size:22px;line-height:42px;display:inline-block;">V</span>
                  </td>
                  <td style="padding-left:12px;text-align:left;">
                    <span style="font-size:18px;font-weight:800;letter-spacing:-0.03em;color:#0B1F4D;display:block;">Vernex</span>
                    <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#64748B;display:block;">Digital Services</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 28px 24px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#0B1F4D;text-align:center;">
                Reset Your Password
              </h1>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;text-align:center;">
                ${fullName ? `Hello <strong>${fullName}</strong>,<br/>` : ""}We received a request to reset the password for your Vernex Digital account. Click the button below to choose a new password.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:24px auto;">
                <tr>
                  <td style="border-radius:30px;background:#1877F2;text-align:center;">
                    <a href="${effectiveResetUrl}" target="_blank" rel="noopener noreferrer" style="background:#1877F2;border:1px solid #1877F2;border-radius:30px;color:#FFFFFF;display:inline-block;font-size:15px;font-weight:700;padding:14px 32px;text-decoration:none;letter-spacing:-0.01em;">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 8px;font-size:12px;line-height:1.5;color:#64748B;text-align:center;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:10px 12px;word-break:break-all;font-size:11px;color:#1877F2;text-align:center;margin-bottom:20px;">
                <a href="${effectiveResetUrl}" style="color:#1877F2;text-decoration:underline;">${effectiveResetUrl}</a>
              </div>

              <!-- Security notice -->
              <div style="background:#F0F6FF;border-radius:12px;border:1px solid #BFDBFE;padding:14px 16px;margin-top:20px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#1E40AF;">
                  <strong>Security Note:</strong> This reset link is valid for 1 hour and can only be used once. If you did not request a password reset, you can safely ignore this email — your account and password remain completely secure.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px;background:#F8FAFC;border-top:1px solid #F1F5F9;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#64748B;">
                Need help? Contact <a href="mailto:support@vernexdigital.com" style="color:#1877F2;text-decoration:none;font-weight:600;">support@vernexdigital.com</a> or message our WhatsApp support.
              </p>
              <p style="margin:0;font-size:11px;color:#94A3B8;">
                &copy; ${new Date().getFullYear()} Vernex Digital Services. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        }),
      });

      emailSent = emailRes.ok;
      if (!emailRes.ok) {
        console.error("Resend error in forgot-password:", await emailRes.text().catch(() => ""));
      }
    }

    // Fallback: If Resend is not set or failed, trigger Supabase built-in auth email
    if (!emailSent) {
      await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo,
      });
    }

    return NextResponse.json({
      ok: true,
      maskedEmail: maskEmail(targetEmail),
      message: `Password reset link sent to ${maskEmail(targetEmail)}. Please check your inbox.`,
    });
  } catch (err) {
    console.error("auth/forgot-password route error:", err);
    return NextResponse.json({ error: "Failed to process password reset request" }, { status: 500 });
  }
}
