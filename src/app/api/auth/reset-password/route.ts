import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

interface ResetTokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
  nonce: string;
}

function getSecretKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VERXOR_PANEL_API_KEY ||
    "vernex-digital-recovery-secret-2026"
  );
}

function verifyResetToken(token: string): { valid: boolean; userId?: string; email?: string; error?: string; iat?: number } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return { valid: false, error: "Invalid token structure" };
    const [dataStr, sig] = parts;
    const secret = getSecretKey();
    const expectedSig = crypto.createHmac("sha256", secret).update(dataStr).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return { valid: false, error: "Invalid or tampered reset token" };
    }
    const payload = JSON.parse(Buffer.from(dataStr, "base64url").toString("utf-8")) as ResetTokenPayload;
    if (Date.now() > payload.exp) {
      return { valid: false, error: "This password reset link has expired (valid for 60 minutes). Please request a new one." };
    }
    return { valid: true, userId: payload.userId, email: payload.email, iat: payload.iat };
  } catch {
    return { valid: false, error: "Malformed reset token" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");
    const email = String(body.email || "").trim().toLowerCase();
    const rawToken = String(body.token || body.token_hash || "").trim();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match. Please re-enter." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const supabase = createServerClient();

    // 1. Check if token is our HMAC-signed reset token
    if (rawToken && rawToken.includes(".")) {
      const verified = verifyResetToken(rawToken);
      if (!verified.valid || !verified.userId) {
        return NextResponse.json(
          { error: verified.error || "Invalid or expired reset link. Please request a new one." },
          { status: 400 },
        );
      }

      // Check single-use: ensure password was not already reset after this token was issued
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(verified.userId);
        const lastReset = Number(userData?.user?.user_metadata?.last_password_reset) || 0;
        if (verified.iat && lastReset > verified.iat) {
          return NextResponse.json(
            { error: "This password reset link has already been used. Please request a new one." },
            { status: 400 },
          );
        }
      } catch (e) {
        console.warn("[reset-password] single-use check warning:", e);
      }

      // Update password directly via Supabase Auth Admin API
      const { error: updError } = await supabase.auth.admin.updateUserById(verified.userId, {
        password,
        email_confirm: true,
        user_metadata: { last_password_reset: Date.now() },
      });

      if (updError) {
        return NextResponse.json({ error: updError.message || "Failed to update password" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, message: "Password updated successfully" });
    }

    // 2. Check if token is a Supabase GoTrue recovery token_hash
    if (rawToken) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: rawToken,
        type: "recovery",
      });

      if (!error && data?.user) {
        const { error: updError } = await supabase.auth.admin.updateUserById(data.user.id, {
          password,
          email_confirm: true,
        });

        if (!updError) {
          return NextResponse.json({ ok: true, message: "Password updated successfully" });
        }
      }
    }

    // 3. Check if caller has an active authenticated session
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.slice(7).trim();
      const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
      if (!userError && userData?.user) {
        const { error: updError } = await supabase.auth.admin.updateUserById(userData.user.id, {
          password,
          email_confirm: true,
        });
        if (!updError) {
          return NextResponse.json({ ok: true, message: "Password updated successfully" });
        }
      }
    }

    return NextResponse.json(
      { error: "A valid password reset link or token is required. Please request a new one." },
      { status: 401 },
    );
  } catch (err) {
    console.error("auth/reset-password route error:", err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
