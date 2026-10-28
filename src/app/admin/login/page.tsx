"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Shield, Loader2, ArrowRight } from "lucide-react";
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
      const emailNorm = email.trim().toLowerCase();

      /* 1) Supabase admin sign-in — the database only recognizes this session */
      const supabase = createBrowserClient();
      const { data, error: signError } = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password,
      });

      if (!signError && data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile?.is_admin) {
          /* best-effort: also set the partner cookie so admin APIs keep working */
          try {
            await fetch("/api/admin/partner-login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ email: emailNorm, password }),
            });
          } catch { /* optional */ }
          try { sessionStorage.setItem("vernex_admin", "1"); } catch {}
          router.replace("/admin");
          return;
        }

        /* signed in, but not an admin */
        await supabase.auth.signOut();
        setError("This account is not an admin. Access denied.");
        setLoading(false);
        return;
      }

      /* 2) Supabase rejected the credentials */
      setError(signError?.message || "Invalid email or password");
      setLoading(false);
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
        typeof window !== "undefined" ? `${window.location.origin}/admin/login` : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo }
      );
      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }
      setInfo("Check your email for a reset link.");
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
              <p className="text-[17px] font-bold tracking-[-0.03em] text-[#0B1F4D]">Vernex</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">Admin</p>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-[#DCE9FC] bg-white/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-1 flex items-center gap-2 text-[#1877F2]">
            <Shield size={18} />
            <span className="text-[12px] font-bold uppercase tracking-[0.08em]">Secure access</span>
          </div>
          <h1 className="text-[22px] font-extrabold tracking-[-0.03em] text-[#0B1F4D]">
            {mode === "login" ? "Admin sign in" : "Reset password"}
          </h1>
          <p className="mt-1 text-[13px] text-[#64748B]">
            {mode === "login"
              ? "Use your partner admin email and password."
              : "We will email a reset link if the account exists."}
          </p>

          <form onSubmit={mode === "login" ? handleLogin : handleForgot} className="mt-5 space-y-3.5">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.06em] text-[#64748B]">
                Admin email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@email.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-[#DCE9FC] bg-[#F8FBFF] py-3 pl-10 pr-3 text-[14px] font-medium text-[#0B1F4D] outline-none focus:border-[#1877F2]"
                />
              </div>
            </div>

            {mode === "login" && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#64748B]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[12px] font-semibold text-[#1877F2]"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-[#DCE9FC] bg-[#F8FBFF] py-3 pl-10 pr-10 text-[14px] font-medium text-[#0B1F4D] outline-none focus:border-[#1877F2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">{error}</p>
            )}
            {info && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-700">{info}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] py-3.5 text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.35)] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign in to admin" : "Send reset link"}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="mt-4 w-full text-center text-[13px] font-semibold text-[#64748B]"
            >
              Back to sign in
            </button>
          )}
        </div>

        <Link href="/" className="mt-6 text-center text-[13px] font-semibold text-[#64748B]">
          ← Back to website
        </Link>
      </div>
    </div>
  );
}
