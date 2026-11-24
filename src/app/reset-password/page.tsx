"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import VernexLogo from "@/components/VernexLogo";
import { createBrowserClient } from "@/lib/supabase/client";

const fieldClass =
  "h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-11 text-[14px] leading-none text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-[#1877F2]/15";

const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenHash, setTokenHash] = useState("");
  const [emailParam, setEmailParam] = useState("");

  useEffect(() => {
    // Read tokens or email from URL if present
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const th = sp.get("token") || sp.get("token_hash") || "";
      const em = sp.get("email") || "";
      if (th) setTokenHash(th);
      if (em) setEmailParam(em);

      // Also parse hash fragment if redirected with #access_token=...
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const hashToken = hashParams.get("access_token");
        const hashType = hashParams.get("type");
        if (hashToken && hashType === "recovery") {
          // Recovery token in hash
        }
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Enter your new password");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!confirmPassword) {
      setError("Confirm your new password");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      let updated = false;

      // 1. Primary method: call our secured reset-password endpoint with the token from query params
      if (tokenHash || emailParam) {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password,
            confirmPassword,
            token: tokenHash,
            token_hash: tokenHash,
            email: emailParam,
          }),
        });
        const resJson = await res.json().catch(() => ({}));
        if (res.ok && resJson.ok) {
          updated = true;
        } else {
          setError(resJson.error || "Could not update password. Please request a new reset link.");
          setLoading(false);
          return;
        }
      }

      // 2. Secondary method: check browser recovery session
      if (!updated) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          const { error: updErr } = await supabase.auth.updateUser({
            password,
          });
          if (!updErr) {
            updated = true;
          }
        }
      }

      if (!updated) {
        setError("No valid reset token found. Please click the reset link in your email again.");
        setLoading(false);
        return;
      }

      // Sign out so they log in cleanly with their new credentials
      await supabase.auth.signOut().catch(() => {});

      setSuccess(true);
      setTimeout(() => {
        router.replace("/login?reset=success");
      }, 1800);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#EBF3FF_0%,#F8FBFF_40%,#FFFFFF_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(24,119,242,0.12),transparent_55%)]" />

      <div className="relative mx-auto flex w-full max-w-[420px] flex-col px-5 pb-12 pt-8">
        {/* Brand header */}
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <VernexLogo size={40} className="shrink-0 rounded-[10px]" />
          <div className="text-left">
            <p className="text-[17px] font-bold leading-tight tracking-[-0.03em] text-[#0B1F4D]">
              Vernex
            </p>
            <p className="text-[10px] font-semibold uppercase leading-tight tracking-[0.14em] text-[#64748B]">
              Digital Services
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="w-full rounded-[20px] border border-[#DCE9FC] bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-6">
          {!success ? (
            <>
              <h1 className="text-[22px] font-bold leading-tight tracking-[-0.03em] text-[#0B1F4D]">
                Set new password
              </h1>
              <p className="mt-1.5 text-[13px] leading-snug text-[#64748B]">
                Enter and confirm your new password below.
              </p>

              <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
                {/* New password field */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                    New password
                  </label>
                  <div className="relative">
                    <Lock size={16} className={iconClass} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      required
                      autoFocus
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                      aria-label="Toggle password"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password field */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock size={16} className={iconClass} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      required
                      className={fieldClass}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                      aria-label="Toggle confirm password"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1877F2] text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(24,119,242,0.28)] transition hover:bg-[#166FE5] active:scale-[0.98] disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving new password…
                    </>
                  ) : (
                    <>
                      Save new password
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#0B1F4D]">
                Password updated!
              </h2>
              <p className="mt-2 text-[13px] text-[#64748B]">
                Your password was reset successfully. Redirecting you to sign in…
              </p>
              <div className="mt-4">
                <Link
                  href="/login?reset=success"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#1877F2] px-6 text-[13px] font-semibold text-white shadow-sm"
                >
                  Go to Sign in
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-[#F1F5F9] pt-4 text-center">
            <Link
              href="/login"
              className="text-[13px] font-semibold text-[#64748B] transition hover:text-[#1877F2]"
            >
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
