"use client";

import { useState } from "react";
import { History as HistoryIcon, Wallet, Sparkles } from "lucide-react";

type Tab = "home" | "history" | "withdraw";

export default function GiftCardPage() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F7FF] to-white pb-24">
      <header className="px-4 pt-6 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1877F2]">Vernex Digital</p>
        <h1 className="text-xl font-bold text-[#0F172A]">Sell Gift Cards</h1>
      </header>

      {tab === "home" && (
        <div className="px-4">
          <p className="text-sm text-[#64748B]">Select a gift card to sell. Full catalog loading...</p>
        </div>
      )}
      {tab === "history" && (
        <div className="px-4">
          <p className="text-center text-sm text-[#94A3B8] py-16">No orders yet</p>
        </div>
      )}
      {tab === "withdraw" && (
        <div className="px-4">
          <p className="text-center text-sm text-[#94A3B8] py-16">No bank account added yet</p>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-6">
          <button
            type="button"
            onClick={() => setTab("home")}
            className="w-14 h-14 -mt-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(24,119,242,0.35)]"
            aria-label="Sell"
          >
            <Sparkles size={24} />
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`flex flex-col items-center gap-0.5 min-w-[72px] ${tab === "history" ? "text-[#1877F2]" : "text-[#64748B]"}`}
          >
            <HistoryIcon size={22} />
            <span className="text-[10px] font-medium">History</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("withdraw")}
            className={`flex flex-col items-center gap-0.5 min-w-[72px] ${tab === "withdraw" ? "text-[#1877F2]" : "text-[#64748B]"}`}
          >
            <Wallet size={22} />
            <span className="text-[10px] font-medium">Withdraw</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
