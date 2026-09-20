"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Plus, Clock } from "lucide-react";

export default function WalletCard() {
  const [visible, setVisible] = useState(true);
  const balance = 0;

  return (
    <div className="rounded-[12px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-5 text-white shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium tracking-wide text-slate-300 uppercase">
          Available Balance
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      </div>

      <div className="flex items-center gap-3 mt-2">
        <p className="text-3xl font-semibold tracking-tight">
          {visible ? `₦${balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "₦••••••"}
        </p>
        <button
          onClick={() => setVisible(!visible)}
          className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label={visible ? "Hide balance" : "Show balance"}
        >
          {visible ? <EyeOff size={18} className="text-slate-300" /> : <Eye size={18} className="text-slate-300" />}
        </button>
      </div>

      <div className="flex gap-3 mt-5">
        <Link
          href="/fund"
          className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-white text-[#0F172A] text-sm font-medium rounded-[10px] hover:bg-slate-100 transition-colors"
        >
          <Plus size={16} />
          Fund Wallet
        </Link>
        <Link
          href="/history"
          className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-white/20 text-white text-sm font-medium rounded-[10px] hover:bg-white/10 transition-colors"
        >
          <Clock size={16} />
          History
        </Link>
      </div>
    </div>
  );
}
