import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const password = String(body.password || "");
    const confirmPassword = String(body.confirmPassword || "");
    const email = String(body.email || "").trim().toLowerCase();
    const tokenHash = String(body.token_hash || body.token || "");

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

    // If tokenHash was provided, verify with Supabase OTP verification
    if (tokenHash && email) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });

      if (error || !data.user) {
        return NextResponse.json(
          { error: error?.message || "Invalid or expired reset link. Please request a new one." },
          { status: 400 },
        );
      }

      // Update password for verified user
      const { error: updError } = await supabase.auth.admin.updateUserById(data.user.id, {
        password,
      });

      if (updError) {
        return NextResponse.json({ error: updError.message || "Failed to update password" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, message: "Password updated successfully" });
    }

    // Direct user lookup by email if token was already exchanged or admin update requested
    if (email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .limit(1)
        .maybeSingle();

      if (profile?.id) {
        const { error: updError } = await supabase.auth.admin.updateUserById(profile.id, {
          password,
        });

        if (updError) {
          return NextResponse.json({ error: updError.message || "Failed to update password" }, { status: 500 });
        }

        return NextResponse.json({ ok: true, message: "Password updated successfully" });
      }
    }

    return NextResponse.json({ error: "Missing verification token or account email" }, { status: 400 });
  } catch (err) {
    console.error("auth/reset-password route error:", err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
