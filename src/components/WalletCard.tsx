"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Plus, Clock } from "lucide-react";

export default function WalletCard() {
  const [visible, setVisible] = useState(true);
  const balance = 0;

  return (
    <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#0B1B3A] via-[#0F2748] to-[#0A1628] p-5 text-white shadow-[0_12px_32px_rgba(11,27,58,0.28)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-slate-300/90">
          Available Balance
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {visible
            ? `₦${balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
            : "₦••••••"}
        </p>
        <button
          onClick={() => setVisible(!visible)}
          className="rounded-full p-1.5 transition-colors hover:bg-white/10"
          aria-label={visible ? "Hide balance" : "Show balance"}
        >
          {visible ? (
            <EyeOff size={18} className="text-slate-300" />
          ) : (
            <Eye size={18} className="text-slate-300" />
          )}
        </button>
      </div>

      <div className="mt-5 flex gap-3">
        <Link
          href="/fund"
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-white text-sm font-semibold text-[#0B1B3A] transition-colors hover:bg-slate-100"
        >
          <Plus size={16} />
          Fund Wallet
        </Link>
        <Link
          href="/history"
          className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-white/20 text-sm font-medium text-slate-100 transition-colors hover:bg-white/5"
        >
          <Clock size={16} />
          History
        </Link>
      </div>
    </div>
  );
}
