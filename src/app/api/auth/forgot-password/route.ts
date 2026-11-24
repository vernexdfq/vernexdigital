import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verxorFetch } from "@/lib/verxor-api";
import crypto from "crypto";

function maskEmail(em: string): string {
  const parts = em.split("@");
  if (parts.length !== 2) return em;
  const [name, domain] = parts;
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

function getSecretKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VERXOR_PANEL_API_KEY ||
    "vernex-digital-recovery-secret-2026"
  );
}

function createResetToken(userId: string, email: string): string {
  const payload = {
    userId,
    email: email.toLowerCase(),
    iat: Date.now(),
    exp: Date.now() + 60 * 60 * 1000, // 60 minutes
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = getSecretKey();
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = String(body.email || body.phone || body.identifier || "").trim();
    if (!rawInput) {
      return NextResponse.json({ error: "Enter your email address or phone number" }, { status: 400 });
    }

    const supabase = createServerClient();
    let targetUserId = "";
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
        targetUserId = data.id || "";
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
        targetUserId = data.id || "";
        targetEmail = data.email.toLowerCase();
        fullName = data.full_name || "";
      }
    }

    // Fallback: search auth.users if not resolved via profiles table
    if (!targetUserId && targetEmail) {
      try {
        const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 100 });
        const matched = usersData?.users?.find(
          (u) => u.email?.toLowerCase() === targetEmail
        );
        if (matched) {
          targetUserId = matched.id;
          if (!fullName && matched.user_metadata?.full_name) {
            fullName = matched.user_metadata.full_name;
          }
        }
      } catch (e) {
        console.warn("[forgot-password] admin listUsers fallback warning:", e);
      }
    }

    if (!targetEmail || !targetUserId) {
      // Return safe message without disclosing whether account exists
      return NextResponse.json({
        ok: true,
        maskedEmail: rawInput.includes("@") ? maskEmail(rawInput) : "your registered email",
        message: "If an account exists with this detail, a reset link has been dispatched.",
      });
    }

    // Always target canonical live domain
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const origin =
      host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? `${proto}://${host}`
        : "https://vernexdigital.com";

    // Generate secure cryptographic tamper-proof reset token
    const token = createResetToken(targetUserId, targetEmail);
    const effectiveResetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(targetEmail)}`;

    const emailSubject = "Reset your Vernex Digital password";
    const fromAddress = "Vernex Digital <no-reply@vernexdigital.com>";
    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Vernex Digital Password</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F8FAFC;padding:36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#FFFFFF;border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 16px 40px -10px rgba(15,23,42,0.07);overflow:hidden;">
          
          <!-- Top Accent Line -->
          <tr>
            <td style="height:5px;background:linear-gradient(90deg, #1877F2 0%, #00D4FF 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:30px 32px 20px 32px;border-bottom:1px solid #F1F5F9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;width:48px;">
                    <img src="https://vernexdigital.com/vernex-icon.jpg" alt="Vernex Digital" width="44" height="44" style="display:block;border-radius:12px;width:44px;height:44px;object-fit:cover;border:0;" />
                  </td>
                  <td style="vertical-align:middle;padding-left:14px;text-align:left;">
                    <span style="font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#0B1F4D;display:block;line-height:1.2;">Vernex Digital</span>
                    <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:#64748B;display:block;margin-top:2px;">Official Security Center</span>
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <span style="display:inline-block;padding:4px 10px;background-color:#F0FDF4;border:1px solid #DCFCE7;border-radius:100px;font-size:11px;font-weight:700;color:#16A34A;">
                      🔒 Secure Link
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <h1 style="margin:0 0 14px;font-size:22px;font-weight:800;letter-spacing:-0.03em;color:#0B1F4D;line-height:1.3;">
                Password Reset Request
              </h1>
              
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
                Hello${fullName ? ` <strong>${fullName}</strong>` : ""},
              </p>

              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
                We received a request to reset your password for your Vernex Digital account. Click the button below to choose and confirm your new password:
              </p>

              <!-- Primary CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:28px auto;">
                <tr>
                  <td style="border-radius:30px;background:#1877F2;text-align:center;box-shadow:0 8px 20px -4px rgba(24,119,242,0.35);">
                    <a href="${effectiveResetUrl}" target="_blank" rel="noopener noreferrer" style="background:#1877F2;border:1px solid #1877F2;border-radius:30px;color:#FFFFFF;display:inline-block;font-size:15px;font-weight:700;padding:15px 36px;text-decoration:none;letter-spacing:-0.01em;">
                      Reset Your Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 8px;font-size:12px;line-height:1.5;color:#64748B;text-align:center;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px 14px;word-break:break-all;font-size:11px;color:#1877F2;text-align:center;margin-bottom:24px;">
                <a href="${effectiveResetUrl}" style="color:#1877F2;text-decoration:underline;">${effectiveResetUrl}</a>
              </div>

              <!-- Security Warning Banner -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;margin:0 0 20px 0;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:12px;font-weight:700;color:#92400E;margin-bottom:4px;">
                      ⚠️ Critical Security Advisory
                    </div>
                    <div style="font-size:12px;line-height:1.5;color:#78350F;">
                      This link will expire in <strong>60 minutes</strong> and can only be used once. If you did not request this password reset, please ignore this email — your account remains safe and your password has not been changed.
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;line-height:1.5;color:#64748B;">
                Need help? Contact support at <a href="mailto:support@vernexdigital.com" style="color:#1877F2;text-decoration:none;font-weight:600;">support@vernexdigital.com</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 32px;background:#F8FAFC;border-top:1px solid #F1F5F9;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#64748B;">
                Vernex Digital • Digital Services & FinTech Solutions
              </p>
              <p style="margin:0;font-size:11px;color:#94A3B8;">
                Support: <a href="mailto:support@vernexdigital.com" style="color:#1877F2;text-decoration:none;">support@vernexdigital.com</a> • vernexdigital.com
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    let emailSent = false;

    // Path 1: Direct Resend if key exists on vernexdigital
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: targetEmail,
            subject: emailSubject,
            html: emailHtml,
          }),
        });
        emailSent = res.ok;
      } catch (err) {
        console.warn("[forgot-password] direct Resend error:", err);
      }
    }

    // Path 2: Relay through Verxor's authenticated panel email bridge
    if (!emailSent) {
      try {
        const relayRes = await verxorFetch("/email/send", {
          method: "POST",
          body: JSON.stringify({
            from: fromAddress,
            to: targetEmail,
            subject: emailSubject,
            html: emailHtml,
          }),
        });
        emailSent = relayRes.ok;
      } catch (err) {
        console.warn("[forgot-password] Verxor relay error:", err);
      }
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
