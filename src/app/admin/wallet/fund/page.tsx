"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Copy,
  Check,
  Hash,
  User,
  Shield,
  Loader2,
  Wallet,
} from "lucide-react";

type VirtualAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  providerLabel?: string;
};

type FundState =
  | { status: "loading" }
  | { status: "demo"; account: VirtualAccount }
  | { status: "ready"; account: VirtualAccount }
  | { status: "error"; message: string };

/**
 * Demo account for Child Panel preview so resellers see the exact flow.
 * Cleared automatically once Flutterwave virtual-account API returns real data.
 */
const DEMO_ACCOUNT: VirtualAccount = {
  bankName: "Wema Bank",
  accountNumber: "7829451031",
  accountName: "VERNEX PANEL / DEMO RESELLER",
  providerLabel: "Flutterwave",
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
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

/**
 * Request a Flutterwave virtual account for this Child Panel’s wholesale wallet.
 * When the API is live, return the real bank details and stop showing demo.
 */
async function fetchPanelVirtualAccount(): Promise<VirtualAccount | null> {
  try {
    // Wire when Flutterwave keys + panel session exist, e.g.:
    // const res = await fetch("/api/admin/wallet/virtual-account", {
    //   method: "POST",
    //   credentials: "include",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ purpose: "wholesale_topup" }),
    // });
    // if (!res.ok) return null;
    // const data = await res.json();
    // if (data?.accountNumber && data?.bankName) return data as VirtualAccount;
    return null;
  } catch {
    return null;
  }
}

export default function AdminFundWholesalePage() {
  const [state, setState] = useState<FundState>({ status: "loading" });
  const [balance] = useState(84250);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const real = await fetchPanelVirtualAccount();
      if (cancelled) return;

      if (real?.accountNumber) {
        setState({ status: "ready", account: real });
      } else {
        // Preview mode: show demo bank so the reseller understands the flow
        setState({ status: "demo", account: DEMO_ACCOUNT });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const account =
    state.status === "demo" || state.status === "ready" ? state.account : null;
  const isDemo = state.status === "demo";

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-20">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/admin/wallet" className="text-[#64748B]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Fund wholesale wallet</h1>
      </header>

      <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">
        {/* Balance */}
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#0B1F4D] to-[#1877F2] p-5 text-white">
          <p className="text-[11px] font-semibold tracking-wide text-white/70 uppercase">
            Panel wholesale balance
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            ₦{balance.toLocaleString()}
          </p>
          <p className="mt-2 text-xs text-white/80 leading-relaxed">
            Transfer to the account below. Funds credit this wallet and are used to fulfill your customers’ orders at Verxor wholesale.
          </p>
        </div>

        {isDemo && (
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-3">
            <p className="text-xs font-semibold text-amber-900">Demo mode</p>
            <p className="mt-0.5 text-xs text-amber-800/90 leading-relaxed">
              Showing sample bank details so you can see how funding works. When Flutterwave is connected, this is replaced by a real virtual account generated for your panel. Demo data is cleared automatically once the API responds.
            </p>
          </div>
        )}

        <section className="rounded-[14px] border border-[#E2E8F0] bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <Building2 size={18} className="text-[#1877F2]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Bank transfer · Flutterwave
            </h2>
          </div>

          {state.status === "loading" && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed border-[#E2E8F0] bg-[#F8FAFC] py-12">
              <Loader2 size={22} className="animate-spin text-[#1877F2]" />
              <p className="text-sm text-[#64748B]">Generating funding account…</p>
            </div>
          )}

          {state.status === "error" && (
            <div className="rounded-[12px] border border-dashed border-[#E2E8F0] bg-[#F8FAFC] px-4 py-10 text-center">
              <p className="text-sm font-medium text-[#0F172A]">Could not load account</p>
              <p className="mt-1.5 text-xs text-[#64748B]">{state.message}</p>
            </div>
          )}

          {account && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1877F2]/10 text-[#1877F2]">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
                      Bank name
                    </p>
                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                      {account.bankName}
                    </p>
                  </div>
                </div>
                <CopyButton value={account.bankName} label="bank name" />
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1877F2]/10 text-[#1877F2]">
                    <Hash size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
                      Account number
                    </p>
                    <p className="truncate text-sm font-semibold tabular-nums text-[#0F172A]">
                      {account.accountNumber}
                    </p>
                  </div>
                </div>
                <CopyButton value={account.accountNumber} label="account number" />
              </div>

              <div className="flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1877F2]/10 text-[#1877F2]">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-[#94A3B8]">
                      Account name
                    </p>
                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                      {account.accountName}
                    </p>
                  </div>
                </div>
                <CopyButton value={account.accountName} label="account name" />
              </div>

              {account.providerLabel && (
                <p className="text-[11px] text-[#94A3B8] text-center pt-1">
                  Powered by {account.providerLabel}
                  {isDemo ? " · demo account" : ""}
                </p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-[14px] border border-[#E2E8F0] bg-white p-4">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            How wholesale funding works
          </h2>
          <ol className="space-y-3">
            {[
              "Copy the bank details generated for your Child Panel.",
              "Transfer any amount from your bank app to that account.",
              "Flutterwave notifies us when the payment lands.",
              "Your panel wholesale wallet is credited automatically — then your customers can buy numbers and services from you.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm leading-snug text-[#334155]">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex items-start gap-2.5 rounded-[12px] border border-[#E2E8F0] bg-white px-4 py-3.5">
          <Shield size={18} className="mt-0.5 shrink-0 text-[#1877F2]" />
          <p className="text-xs leading-relaxed text-[#475569]">
            <span className="font-semibold text-[#0F172A]">Automatic credit:</span>{" "}
            Successful transfers update your admin panel balance. That balance pays Verxor wholesale when your users buy numbers, SMM, accounts, and other services on your brand.
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-[12px] border border-[#E2E8F0] bg-white px-4 py-3.5">
          <Wallet size={18} className="mt-0.5 shrink-0 text-[#1877F2]" />
          <p className="text-xs leading-relaxed text-[#475569]">
            <span className="font-semibold text-[#0F172A]">Your customers</span> fund their own wallets on your site (separate accounts). You fund this wholesale wallet so their orders can be fulfilled.
          </p>
        </div>
      </div>
    </div>
  );
}
