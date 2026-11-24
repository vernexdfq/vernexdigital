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

    // Verify recovery token hash with Supabase Auth
    if (tokenHash) {
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

      // Update password for verified user ID
      const { error: updError } = await supabase.auth.admin.updateUserById(data.user.id, {
        password,
      });

      if (updError) {
        return NextResponse.json({ error: updError.message || "Failed to update password" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, message: "Password updated successfully" });
    }

    // Check if the request carries an authenticated Bearer token
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.slice(7).trim();
      const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
      if (!userError && userData?.user) {
        const { error: updError } = await supabase.auth.admin.updateUserById(userData.user.id, {
          password,
        });
        if (!updError) {
          return NextResponse.json({ ok: true, message: "Password updated successfully" });
        }
      }
    }

    return NextResponse.json(
      { error: "A valid verification token or recovery session is required to reset password" },
      { status: 401 },
    );
  } catch (err) {
    console.error("auth/reset-password route error:", err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
