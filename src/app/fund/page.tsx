"use client";

import { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { useUser } from "@/lib/useUser";

export type VirtualAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  providerLabel?: string;
};

type FundState =
  | { status: "loading" }
  | { status: "empty"; message?: string }
  | { status: "ready"; accounts: VirtualAccount[] }
  | { status: "error"; message: string };

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

async function fetchVirtualAccounts(): Promise<VirtualAccount[]> {
  return [];
}

export default function FundPage() {
  const router = useRouter();
  const { wallet, loading: walletLoading } = useUser();
  const [state, setState] = useState<FundState>({ status: "loading" });
  const [activeIndex, setActiveIndex] = useState(0);
  const balance = wallet.balance;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const accounts = await fetchVirtualAccounts();
        if (cancelled) return;
        if (!accounts.length) {
          setState({
            status: "empty",
            message:
              "Your permanent funding account will appear here once the payment provider is connected.",
          });
          return;
        }
        setState({ status: "ready", accounts });
        setActiveIndex(0);
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Could not load funding details. Try again shortly.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeAccount =
    state.status === "ready" ? state.accounts[activeIndex] ?? null : null;

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

        <section className="rounded-[14px] border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Building2 size={18} className="text-[#1877F2]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">Fund via Bank Transfer</h2>
          </div>

          {state.status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-[#E2E8F0] bg-[#F8FAFC] py-12">
              <Loader2 size={22} className="animate-spin text-[#1877F2]" />
              <p className="text-sm text-[#64748B]">Loading funding account…</p>
            </div>
          )}

          {(state.status === "empty" || state.status === "error") && (
            <div className="rounded-[12px] border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-4 py-10 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white border border-[#E2E8F0]">
                <Building2 size={20} className="text-[#94A3B8]" />
              </div>
              <p className="text-sm font-medium text-[#0F172A]">
                {state.status === "error" ? "Funding account unavailable" : "No funding account yet"}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-[#64748B]">{state.message}</p>
            </div>
          )}

          {state.status === "ready" && activeAccount && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1877F2]/10 text-[#1877F2]">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">Bank Name</p>
                    <p className="truncate text-sm font-semibold text-[#0F172A]">{activeAccount.bankName}</p>
                  </div>
                </div>
                <CopyButton value={activeAccount.bankName} label="bank name" />
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1877F2]/10 text-[#1877F2]">
                    <Hash size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">Account Number</p>
                    <p className="truncate text-sm font-semibold tabular-nums text-[#0F172A]">
                      {activeAccount.accountNumber}
                    </p>
                  </div>
                </div>
                <CopyButton value={activeAccount.accountNumber} label="account number" />
              </div>
              <div className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1877F2]/10 text-[#1877F2]">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">Account Name</p>
                    <p className="truncate text-sm font-semibold text-[#0F172A]">{activeAccount.accountName}</p>
                  </div>
                </div>
                <CopyButton value={activeAccount.accountName} label="account name" />
              </div>
            </div>
          )}
        </section>

        <div className="flex items-start gap-2.5 rounded-[12px] border border-[#E2E8F0] bg-white px-4 py-3.5 shadow-sm">
          <Shield size={18} className="mt-0.5 shrink-0 text-[#1877F2]" />
          <p className="text-xs leading-relaxed text-[#475569]">
            <span className="font-semibold text-[#0F172A]">Instant & Secure:</span> Transfers are
            processed automatically when your funding account is active.
          </p>
        </div>
      </div>
    </div>
  );
}
