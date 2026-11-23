"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import VernexLogo from "@/components/VernexLogo";

const fieldClass =
  "h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-3 text-[14px] leading-none text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-[#1877F2]/15";

const iconClass =
  "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const input = identifier.trim();
    if (!input) {
      setError("Enter your email address or phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: input }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Could not send reset link. Please try again.");
        return;
      }

      setMaskedEmail(data.maskedEmail || (input.includes("@") ? input : "your registered email"));
      setSent(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
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
          {!sent ? (
            <>
              <h1 className="text-[22px] font-bold leading-tight tracking-[-0.03em] text-[#0B1F4D]">
                Reset your password
              </h1>
              <p className="mt-1.5 text-[13px] leading-snug text-[#64748B]">
                Enter your account email or phone number. We'll send a secure password reset link to your email.
              </p>

              <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                    Email address or phone number
                  </label>
                  <div className="relative">
                    <Mail size={16} className={iconClass} />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="you@example.com or 08012345678"
                      autoComplete="username"
                      required
                      autoFocus
                      className={fieldClass}
                    />
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
                      Sending reset link…
                    </>
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1877F2]">
                <CheckCircle2 size={28} />
              </div>
              <h2 className="text-[20px] font-bold tracking-[-0.03em] text-[#0B1F4D]">
                Check your email
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-[#64748B]">
                We sent a password reset link to <strong className="text-[#0F172A]">{maskedEmail}</strong>.
              </p>
              <div className="mt-4 rounded-xl border border-[#DCE9FC] bg-[#F8FBFF] p-3.5 text-left text-[12px] leading-relaxed text-[#475569]">
                Click the button in that email to choose your new password. The link expires in 1 hour.
              </div>

              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError("");
                }}
                className="mt-4 text-[13px] font-semibold text-[#1877F2] hover:underline"
              >
                Didn't get the email? Try again
              </button>
            </div>
          )}

          <div className="mt-6 border-t border-[#F1F5F9] pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#64748B] transition hover:text-[#1877F2]"
            >
              <ArrowLeft size={14} />
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
