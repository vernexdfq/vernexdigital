"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Copy,
  Check,
  Hash,
  User,
  Shield,
  Loader2,
  Clock,
  Wallet,
} from "lucide-react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";

type VirtualAccount = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  expireAt?: string | null;
};

type FundState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; account: VirtualAccount }
  | { status: "error"; message: string };

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000];
const PANEL_SLUG = "vernexdigital";
const ACCOUNT_NAME = "Verxor–vernexdigital";

function formatNgn(n: number) {
  return n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-[#DCE3EE] bg-white px-3 text-[12px] font-bold text-[#1877F2] shadow-sm active:scale-[0.98]"
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <>
          <Check size={14} className="text-emerald-600" strokeWidth={2.5} />
          <span className="text-emerald-600">Copied</span>
        </>
      ) : (
        <>
          <Copy size={14} strokeWidth={2.4} />
          Copy
        </>
      )}
    </button>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  const valueClass = mono ? "tabular-nums tracking-wide" : "";
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E8EEF5] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1877F2]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
            {label}
          </p>
          <p className={`mt-0.5 truncate text-[15px] font-extrabold text-[#0F172A] ${valueClass}`}>
            {value}
          </p>
        </div>
      </div>
      <CopyButton value={value} label={label.toLowerCase()} />
    </div>
  );
}

function useExpireCountdown(expireAt?: string | null) {
  const [left, setLeft] = useState<string | null>(null);
  useEffect(() => {
    if (!expireAt) {
      setLeft(null);
      return;
    }
    const tick = () => {
      const end = new Date(expireAt).getTime();
      if (Number.isNaN(end)) {
        setLeft(null);
        return;
      }
      const ms = end - Date.now();
      if (ms <= 0) {
        setLeft("00:00");
        return;
      }
      const totalSec = Math.floor(ms / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      setLeft(String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0"));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expireAt]);
  return left;
}

export default function AdminPartnerFundPage() {
  const [state, setState] = useState<FundState>({ status: "idle" });
  const [amountInput, setAmountInput] = useState("10000");
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const expireLeft = useExpireCountdown(
    state.status === "ready" ? state.account.expireAt : null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBalanceLoading(true);
      try {
        const res = await fetch("/api/admin/partner-balance", {
          credentials: "include",
          cache: "no-store",
        }).catch(() => null);
        if (cancelled) return;
        if (res?.ok) {
          const data = await res.json().catch(() => ({}));
          if (typeof data.balance === "number") {
            setBalance(data.balance);
            return;
          }
        }
        setBalance(0);
      } catch {
        if (!cancelled) setBalance(0);
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state.status]);

  const generateAccount = useCallback(async () => {
    const amount = Math.round(Number(amountInput.replace(/,/g, "")));
    if (!Number.isFinite(amount) || amount < 500) {
      setState({ status: "error", message: "Minimum panel top-up is ₦500." });
      return;
    }

    setState({ status: "loading" });
    try {
      const res = await fetch("/api/admin/partner-fund", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          accountName: ACCOUNT_NAME,
          panelSlug: PANEL_SLUG,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          status: "error",
          message:
            data.error || "Could not create funding account. Please try again.",
        });
        return;
      }

      setState({
        status: "ready",
        account: {
          bankName: data.bankName || "OPay",
          accountNumber: String(data.accountNumber || ""),
          accountName: data.accountName || ACCOUNT_NAME,
          amount: Number(data.amount) || amount,
          expireAt: data.expireAt || null,
        },
      });
      if (typeof data.balance === "number") setBalance(data.balance);
    } catch {
      setState({
        status: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  }, [amountInput]);

  const amountLabel = useMemo(() => {
    const n = Math.round(Number(amountInput.replace(/,/g, "")));
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }, [amountInput]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-28">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <AdminMenuButton onClick={() => setMenuOpen(true)} />
            <div className="min-w-0">
              <h1 className="text-[16px] font-extrabold tracking-tight text-[#0F172A] truncate">
                Partner Fund
              </h1>
              <p className="text-[11px] font-semibold text-[#64748B] truncate">
                Verxor · {PANEL_SLUG}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-4">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0F172A] px-5 py-5 text-white shadow-[0_12px_32px_rgba(15,23,42,0.22)]">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#1877F2]/20 blur-2xl"
            aria-hidden
          />
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Panel wholesale balance
          </p>
          <p className="mt-2 text-[34px] font-extrabold leading-none tracking-tight tabular-nums">
            {balanceLoading || balance === null
              ? "₦…"
              : "₦" + formatNgn(balance)}
          </p>
          <p className="mt-3.5 flex items-center gap-2 text-[12px] font-semibold text-emerald-300">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.25)]" />
            Used to fulfill your users&apos; Verxor orders
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 px-0.5">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#475569]" strokeWidth={2.4} />
            <span className="text-[13px] font-bold text-[#0F172A]">
              Fund via Bank Transfer
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1877F2] px-3 py-1 text-[11px] font-extrabold text-white shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            OPay
          </span>
        </div>

        {state.status !== "ready" ? (
          <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1877F2]">
              <Wallet size={26} strokeWidth={2.2} />
            </div>
            <h2 className="text-center text-[18px] font-extrabold text-[#0F172A]">
              Generate OPay account
            </h2>
            <p className="mt-1.5 text-center text-[13px] leading-relaxed text-[#64748B]">
              Enter any amount, generate an account, then transfer that amount.
              Your panel wallet is credited automatically when the bank confirms.
            </p>

            <label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
              Amount (₦)
            </label>
            <div className="relative mt-2">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[#64748B]">
                ₦
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) =>
                  setAmountInput(e.target.value.replace(/[^0-9]/g, ""))
                }
                className="h-14 w-full rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-4 text-[18px] font-extrabold tabular-nums text-[#0F172A] outline-none transition focus:border-[#1877F2] focus:bg-white focus:ring-4 focus:ring-[#1877F2]/15"
                placeholder="e.g. 10000"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((a) => {
                const active = String(a) === amountInput;
                const chipClass = active
                  ? "border-[#1877F2] bg-[#1877F2] text-white shadow-sm"
                  : "border-[#E2E8F0] bg-white text-[#0F172A]";
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmountInput(String(a))}
                    className={`h-10 rounded-xl border px-3.5 text-[12px] font-bold transition active:scale-[0.97] ${chipClass}`}
                  >
                    ₦{a.toLocaleString("en-NG")}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={generateAccount}
              disabled={state.status === "loading"}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#16A34A] text-[15px] font-extrabold text-white shadow-[0_8px_20px_rgba(22,163,74,0.35)] transition active:scale-[0.98] disabled:opacity-60"
            >
              {state.status === "loading" ? (
                <>
                  <Loader2 size={20} className="animate-spin" strokeWidth={2.5} />
                  Generating…
                </>
              ) : (
                <>
                  <span className="text-xl leading-none">+</span>
                  Generate OPay Account
                  {amountLabel ? " · ₦" + amountLabel.toLocaleString("en-NG") : ""}
                </>
              )}
            </button>

            {state.status === "error" && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-center text-[13px] font-semibold text-red-600">
                {state.message}
              </p>
            )}
          </section>
        ) : (
          <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            {expireLeft && (
              <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[#E8EEF5] bg-[#F8FAFC] px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1877F2]">
                  <Clock size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Expires in
                  </p>
                  <p className="text-[18px] font-extrabold tabular-nums text-[#0F172A]">
                    {expireLeft}
                  </p>
                </div>
              </div>
            )}

            <DetailRow
              icon={<Building2 size={18} strokeWidth={2.3} />}
              label="Bank Name"
              value={state.account.bankName}
            />
            <div className="mt-3">
              <DetailRow
                icon={<Hash size={18} strokeWidth={2.3} />}
                label="Account Number"
                value={state.account.accountNumber}
                mono
              />
            </div>
            <div className="mt-3">
              <DetailRow
                icon={<User size={18} strokeWidth={2.3} />}
                label="Account Name"
                value={state.account.accountName}
              />
            </div>

            <p className="mt-4 text-center text-[13px] font-semibold leading-snug text-[#475569]">
              Transfer <span className="font-extrabold text-[#0F172A]">{"₦" + formatNgn(state.account.amount)}</span> to this account. Panel balance credits automatically.
            </p>

            <button
              type="button"
              onClick={() => setState({ status: "idle" })}
              className="mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-[#16A34A] text-[15px] font-extrabold text-white shadow-[0_8px_20px_rgba(22,163,74,0.3)] active:scale-[0.98]"
            >
              Generate new amount
            </button>
          </section>
        )}

        <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
          <h3 className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#94A3B8]">
            How to fund this panel
          </h3>
          <ol className="mt-4 space-y-4">
            {[
              "Enter any amount and generate an OPay account.",
              "Transfer that exact amount to the bank name, account number and account name shown (Verxor–vernexdigital).",
              "When the bank confirms, this panel wholesale balance updates automatically — then your users can buy numbers from Verxor through you.",
            ].map((text, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-[12px] font-extrabold text-white">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-[13px] font-medium leading-snug text-[#334155]">
                  {text}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="flex items-start gap-3 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-4">
          <Shield
            size={20}
            className="mt-0.5 shrink-0 text-[#1877F2]"
            strokeWidth={2.3}
          />
          <p className="text-[12px] leading-relaxed text-[#1E3A5F]">
            <span className="font-extrabold text-[#0F172A]">Instant & Secure:</span>{" "}
            Account name is always <span className="font-extrabold">{ACCOUNT_NAME}</span> — not a personal
            name. Funds credit the panel wholesale wallet used for Verxor virtual
            numbers and services.
          </p>
        </div>
      </div>
    </div>
  );
}
