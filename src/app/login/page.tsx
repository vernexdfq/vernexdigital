"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Mail,
  Lock,
  Hash,
  Eye,
  EyeOff,
  ArrowRight,
  MessageCircle,
  Loader2,
} from "lucide-react";
import VernexLogo from "@/components/VernexLogo";
import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"password" | "pin">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createBrowserClient();

      if (mode === "password") {
        if (!email.trim() || !password) {
          setError("Enter your email and password");
          setLoading(false);
          return;
        }

        const { data, error: signError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signError) {
          setError(signError.message || "Invalid email or password");
          setLoading(false);
          return;
        }

        if (!data.session) {
          setError("Could not start session. Try again.");
          setLoading(false);
          return;
        }

        router.replace("/home");
        return;
      }

      if (!email.trim() || pin.length !== 4) {
        setError("Enter your email and 4-digit PIN");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), pin }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        setError(json.error || "Invalid email or PIN");
        setLoading(false);
        return;
      }

      const { error: otpError } = await supabase.auth.verifyOtp({
        email: json.email,
        token_hash: json.token_hash,
        type: "email",
      });

      if (otpError) {
        setError(otpError.message || "Could not complete PIN login");
        setLoading(false);
        return;
      }

      router.replace("/home");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#EBF3FF_0%,#F8FBFF_40%,#FFFFFF_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(24,119,242,0.12),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-10 sm:px-6">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2.5">
            <VernexLogo size={40} className="rounded-[10px]" />
            <div className="text-left">
              <p className="text-[17px] font-bold tracking-[-0.03em] text-[#0B1F4D]">
                Vernex
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                Digital Services
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-[#DCE9FC] bg-white/95 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-6">
          <h1 className="text-[26px] font-bold tracking-[-0.03em] text-[#0B1F4D]">
            Welcome back
          </h1>
          <p className="mt-1 text-[13px] text-[#64748B]">
            Sign in to manage your services and wallet.
          </p>

          <div className="mt-5 flex rounded-full border border-[#E2E8F0] bg-[#F8FAFC] p-1">
            <Link
              href="/login"
              className="flex-1 rounded-full bg-[#1877F2] py-2.5 text-center text-[13px] font-semibold text-white shadow-sm"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex-1 rounded-full py-2.5 text-center text-[13px] font-semibold text-[#64748B] transition hover:text-[#0F172A]"
            >
              Create account
            </Link>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                Email address
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
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-3 text-[14px] text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-[#1877F2]/15"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#64748B]">
                  {mode === "password" ? "Password" : "4-digit PIN"}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "password" ? "pin" : "password");
                      setError("");
                    }}
                    className="text-[11px] font-semibold text-[#1877F2]"
                  >
                    Use {mode === "password" ? "PIN" : "password"}
                  </button>
                </div>
              </div>

              {mode === "password" ? (
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required={mode === "password"}
                    className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-11 text-[14px] text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-[#1877F2]/15"
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
              ) : (
                <div className="relative">
                  <Hash
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="Enter 4-digit PIN"
                    autoComplete="one-time-code"
                    required={mode === "pin"}
                    className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-3 text-[14px] tracking-[0.3em] text-[#0F172A] outline-none transition placeholder:tracking-normal placeholder:text-[#94A3B8] focus:border-[#1877F2] focus:bg-white focus:ring-2 focus:ring-[#1877F2]/15"
                  />
                </div>
              )}
            </div>

            {error && (
              <p className="rounded-[10px] bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1877F2] text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(24,119,242,0.28)] transition hover:bg-[#166FE5] active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-[#64748B]">
            New to Vernex?{" "}
            <Link href="/register" className="font-semibold text-[#1877F2]">
              Create an account
            </Link>
          </p>
        </div>

        <div className="mt-5 rounded-[16px] border border-[#DCE9FC] bg-white/80 p-4 text-center">
          <p className="text-[12px] text-[#64748B]">
            Need help signing in or creating an account?
          </p>
          <a
            href="https://wa.me/2349164159443"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#B7D4F8] bg-[#F0F6FF] px-4 text-[12px] font-semibold text-[#1877F2] transition hover:bg-[#E5F0FF]"
          >
            <MessageCircle size={14} />
            Contact support on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
