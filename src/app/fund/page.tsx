"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Copy,
  Check,
  Hash,
  User,
  Shield,
  Loader2,
  Clock,
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import { createBrowserClient } from "@/lib/supabase/client";

export type VirtualAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  expireAt?: string | null;
  transactionId?: string | null;
};

type FundState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; account: VirtualAccount }
  | { status: "error"; message: string };

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }, [value]);

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#1877F2]"
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <>
          <Check size={14} className="text-emerald-600" />
          <span className="text-emerald-600">Copied</span>
        </>
      ) : (
        <>
          <Copy size={14} />
          Copy
        </>
      )}
    </button>
  );
}

export default function FundPage() {
  const router = useRouter();
  const { wallet, loading: walletLoading, refresh } = useUser();
  const [state, setState] = useState<FundState>({ status: "idle" });
  const [amountInput, setAmountInput] = useState("1000");
  const balance = wallet.balance;

  const generateAccount = useCallback(async () => {
    const amount = Math.round(Number(amountInput.replace(/,/g, "")));
    if (!Number.isFinite(amount) || amount < 100) {
      setState({ status: "error", message: "Enter at least ₦100." });
      return;
    }

    setState({ status: "loading" });
    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setState({ status: "error", message: "Sign in again to fund your wallet." });
        return;
      }

      const res = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          status: "error",
          message: data.error || "Could not create funding account.",
        });
        return;
      }

      setState({
        status: "ready",
        account: {
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountName: data.accountName,
          amount: data.amount,
          expireAt: data.expireAt,
          transactionId: data.transactionId,
        },
      });
      refresh();
    } catch {
      setState({
        status: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }, [amountInput, refresh]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] text-[#0F172A]"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-semibold text-[#0F172A]">Fund Wallet</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        <div className="relative overflow-hidden rounded-[14px] bg-[#0B1220] p-5 text-white shadow-[0_10px_28px_rgba(15,23,42,0.18)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">
            Wallet Balance
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
            {walletLoading
              ? "₦…"
              : `₦${balance.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300/90">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Available for transactions
          </p>
        </div>

        {state.status !== "ready" && (
          <section className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">Enter amount</h2>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#64748B]">
                ₦
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] py-3 pl-8 pr-3 text-base font-semibold tabular-nums text-[#0F172A] outline-none focus:border-[#1877F2]"
                placeholder="1000"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmountInput(String(a))}
                  className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#0F172A]"
                >
                  ₦{a.toLocaleString("en-NG")}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={generateAccount}
              disabled={state.status === "loading"}
              className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-[#1877F2] py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {state.status === "loading" ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating account…
                </>
              ) : (
                "Generate payment account"
              )}
            </button>
            {state.status === "error" && (
              <p className="text-center text-xs text-red-600">{state.message}</p>
            )}
          </section>
        )}

        {state.status === "ready" && (
          <section className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Building2 size={18} className="text-[#1877F2]" />
              <h2 className="text-sm font-semibold text-[#0F172A]">Pay exactly this amount</h2>
            </div>
            <p className="mb-3 rounded-[10px] bg-[#EFF6FF] px-3 py-2 text-center text-lg font-bold tabular-nums text-[#1877F2]">
              ₦
              {state.account.amount.toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1877F2]/10 text-[#1877F2]">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
                      Bank Name
                    </p>
                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                      {state.account.bankName}
                    </p>
                  </div>
                </div>
                <CopyButton value={state.account.bankName} label="bank name" />
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1877F2]/10 text-[#1877F2]">
                    <Hash size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
                      Account Number
                    </p>
                    <p className="truncate text-sm font-semibold tabular-nums text-[#0F172A]">
                      {state.account.accountNumber}
                    </p>
                  </div>
                </div>
                <CopyButton value={state.account.accountNumber} label="account number" />
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1877F2]/10 text-[#1877F2]">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
                      Account Name
                    </p>
                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                      {state.account.accountName}
                    </p>
                  </div>
                </div>
                <CopyButton value={state.account.accountName} label="account name" />
              </div>
              {state.account.expireAt && (
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <Clock size={14} />
                  <span>Expires: {state.account.expireAt}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setState({ status: "idle" });
                refresh();
              }}
              className="mt-4 w-full rounded-[12px] border border-[#E2E8F0] py-2.5 text-sm font-medium text-[#0F172A]"
            >
              Generate another amount
            </button>
          </section>
        )}

        <div className="flex items-start gap-2.5 rounded-[12px] border border-[#E2E8F0] bg-white px-4 py-3.5 shadow-sm">
          <Shield size={18} className="mt-0.5 shrink-0 text-[#1877F2]" />
          <p className="text-xs leading-relaxed text-[#475569]">
            <span className="font-semibold text-[#0F172A]">Instant & Secure:</span> Transfer the{" "}
            exact amount. Your wallet updates automatically when payment is confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}
