"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Loader2,
  ArrowRight,
} from "lucide-react";
import VernexLogo from "@/components/VernexLogo";
import { createBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const supabase = createBrowserClient();
      const { data, error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signError) {
        setError(signError.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Could not sign in");
        setLoading(false);
        return;
      }

      // Check is_admin on profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!profile?.is_admin) {
        await supabase.auth.signOut();
        setError("This account is not an admin. Access denied.");
        setLoading(false);
        return;
      }

      // Mark admin session for client guards
      try {
        sessionStorage.setItem("vernex_admin", "1");
      } catch {}

      router.replace("/admin");
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (!email.trim().includes("@")) {
        setError("Enter your admin email");
        setLoading(false);
        return;
      }

      const supabase = createBrowserClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/admin/login`
          : undefined;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo }
      );

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setInfo(
        "Check your email for a reset link. Open it, set a new password, then sign in here."
      );
      setLoading(false);
    } catch {
      setError("Could not send reset email");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#EBF3FF_0%,#F8FBFF_40%,#FFFFFF_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(24,119,242,0.12),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-12 sm:px-6">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2.5">
            <VernexLogo size={40} className="rounded-[10px]" />
            <div className="text-left">
              <p className="text-[17px] font-bold tracking-[-0.03em] text-[#0B1F4D]">
                Vernex
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                Admin
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-[#DCE9FC] bg-white/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-1 flex items-center gap-2 text-[#1877F2]">
            <Shield size={18} />
            <span className="text-[12px] font-bold uppercase tracking-[0.08em]">
              Secure access
            </span>
          </div>
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#0B1F4D]">
            {mode === "login" ? "Admin sign in" : "Reset password"}
          </h1>
          <p className="mt-1 text-[13px] text-[#64748B]">
            {mode === "login"
              ? "Use your admin email and password."
              : "We will email you a link to set a new password."}
          </p>

          <form
            className="mt-6 space-y-4"
            onSubmit={mode === "login" ? handleLogin : handleForgot}
          >
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                Admin email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vernexdigital.com"
                  required
                  autoComplete="email"
                  className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-3 text-[14px] text-[#0F172A] outline-none focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-[#1877F2]/15"
                />
              </div>
            </div>

            {mode === "login" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setInfo("");
                    }}
                    className="text-[11px] font-semibold text-[#1877F2]"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    required
                    autoComplete="current-password"
                    className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-11 text-[14px] text-[#0F172A] outline-none focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-[#1877F2]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-[10px] bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-[10px] bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1877F2] text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(24,119,242,0.28)] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Please wait…
                </>
              ) : mode === "login" ? (
                <>
                  Sign in to admin
                  <ArrowRight size={16} />
                </>
              ) : (
                "Send reset email"
              )}
            </button>
          </form>

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setInfo("");
              }}
              className="mt-4 w-full text-center text-[13px] font-semibold text-[#1877F2]"
            >
              Back to sign in
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-[#94A3B8]">
          <Link href="/" className="font-medium text-[#64748B] hover:text-[#1877F2]">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
