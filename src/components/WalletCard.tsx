"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Plus, Clock } from "lucide-react";

export default function WalletCard() {
  const [visible, setVisible] = useState(true);
  const balance = 0;

  return (
    <div className="relative overflow-hidden rounded-[12px] bg-gradient-to-br from-[#0B1220] to-[#141E2E] p-5 text-white shadow-sm">
      {/* subtle blue accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#1877F2]" />

      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium tracking-wide text-slate-400 uppercase">
          Available Balance
        </span>
        <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {visible
            ? `₦${balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
            : "₦••••••"}
        </p>
        <button
          onClick={() => setVisible(!visible)}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label={visible ? "Hide balance" : "Show balance"}
        >
          {visible ? (
            <EyeOff size={18} className="text-slate-400" />
          ) : (
            <Eye size={18} className="text-slate-400" />
          )}
        </button>
      </div>

      <div className="flex gap-3 mt-5">
        <Link
          href="/fund"
          className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-[#1877F2] text-white text-sm font-medium rounded-[10px] hover:bg-[#166FE5] transition-colors"
        >
          <Plus size={16} />
          Fund Wallet
        </Link>
        <Link
          href="/history"
          className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-white/15 text-slate-200 text-sm font-medium rounded-[10px] hover:bg-white/5 transition-colors"
        >
          <Clock size={16} />
          History
        </Link>
      </div>
    </div>
  );
}
