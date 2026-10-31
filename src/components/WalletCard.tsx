"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Plus, Clock } from "lucide-react";
import { useUser } from "@/lib/useUser";

export default function WalletCard() {
  const [visible, setVisible] = useState(true);
  const { wallet, loading } = useUser();
  const balance = wallet.balance;

  return (
    <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#0B1B3A] via-[#0F2748] to-[#0A1628] p-5 text-white shadow-[0_12px_32px_rgba(11,27,58,0.28)]">
      {/* Subtle sheen for depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]"
      />

      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-slate-300/90">
          Available Balance
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      </div>

      <div className="relative mt-3 flex items-center gap-3">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {loading
            ? "₦…"
            : visible
              ? `₦${balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
              : "₦••••••"}
        </p>
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="rounded-full p-1.5 transition-all duration-150 hover:bg-white/10 active:scale-90"
          aria-label={visible ? "Hide balance" : "Show balance"}
        >
          {visible ? (
            <EyeOff size={18} className="text-slate-300" />
          ) : (
            <Eye size={18} className="text-slate-300" />
          )}
        </button>
      </div>

      <div className="relative mt-5 flex gap-3">
        <Link
          href="/fund"
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-white text-sm font-semibold text-[#0B1B3A] shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-all duration-150 ease-out hover:bg-slate-100 active:scale-[0.97] active:translate-y-[1px] active:shadow-none"
        >
          <Plus size={16} />
          Fund Wallet
        </Link>
        <Link
          href="/history"
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-white/20 text-sm font-medium text-slate-100 transition-all duration-150 ease-out hover:bg-white/5 active:scale-[0.97] active:translate-y-[1px]"
        >
          <Clock size={16} />
          History
        </Link>
      </div>
    </div>
  );
}
