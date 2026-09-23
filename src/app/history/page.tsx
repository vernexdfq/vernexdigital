"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  List,
  PieChart,
  Rocket,
  Phone,
  RotateCcw,
  CreditCard,
  Upload,
  ShoppingBag,
  Calendar,
  ArrowLeftRight,
  Plus,
  Minus,
} from "lucide-react";

type TxnKind = "boost" | "virtual" | "refund" | "gift" | "topup";
type HistMode = "list" | "stats";

type Txn = {
  id: string;
  title: string;
  amount: number;
  status: string;
  when: string;
  kind: TxnKind;
};

/** Demo transactions matching primex.ng/use — auto-removed when Supabase key is present */
const DEMO_TXNS: Txn[] = [
  { id: "d1", title: "Boosting: Instagram", amount: -386.96, status: "Success", when: "Jul 16, 2026 · 1:18am", kind: "boost" },
  { id: "d2", title: "Boosting: Facebook", amount: -246.38, status: "Success", when: "Jul 16, 2026 · 12:48am", kind: "boost" },
  { id: "d3", title: "Boosting: Twitter", amount: -226.98, status: "Success", when: "Jul 16, 2026 · 12:31am", kind: "boost" },
  { id: "d4", title: "Refund: Boosting order", amount: 191.1, status: "Success", when: "Jul 16, 2026 · 12:02am", kind: "refund" },
  { id: "d5", title: "Boosting: YouTube", amount: -191.1, status: "Success", when: "Jul 16, 2026 · 12:02am", kind: "boost" },
  { id: "d6", title: "Boosting: YouTube", amount: -191.1, status: "Success", when: "Jul 15, 2026 · 11:58pm", kind: "boost" },
  { id: "d7", title: "Refund: Boosting order", amount: 191.1, status: "Success", when: "Jul 15, 2026 · 11:58pm", kind: "refund" },
  { id: "d8", title: "Boosting: YouTube", amount: -191.1, status: "Success", when: "Jul 15, 2026 · 11:57pm", kind: "boost" },
  { id: "d9", title: "Virtual Number (US)", amount: -2160, status: "Success", when: "Jul 15, 2026 · 11:13pm", kind: "virtual" },
  { id: "d10", title: "Boosting: Spotify", amount: -500.26, status: "Success", when: "Jul 15, 2026 · 12:13am", kind: "boost" },
  { id: "d11", title: "Boosting: Audiomack", amount: -567, status: "Success", when: "Jul 15, 2026 · 12:05am", kind: "boost" },
  { id: "d12", title: "Boosting: Audiomack", amount: -397.22, status: "Success", when: "Jul 15, 2026 · 12:02am", kind: "boost" },
  { id: "d13", title: "Refund — Cancelled", amount: 3475, status: "Success", when: "Jul 14, 2026 · 1:02pm", kind: "refund" },
  { id: "d14", title: "Virtual Number (All)", amount: -3475, status: "Success", when: "Jul 14, 2026 · 1:00pm", kind: "virtual" },
  { id: "d15", title: "Refund - Virtual Number", amount: 2295, status: "Success", when: "Jul 14, 2026 · 12:59pm", kind: "refund" },
  { id: "d16", title: "Virtual Number (All)", amount: -2295, status: "Success", when: "Jul 14, 2026 · 12:59pm", kind: "virtual" },
  { id: "d17", title: "Refund - Virtual Number", amount: 2295, status: "Success", when: "Jul 14, 2026 · 12:32pm", kind: "refund" },
  { id: "d18", title: "Virtual Number (All)", amount: -2295, status: "Success", when: "Jul 14, 2026 · 12:31pm", kind: "virtual" },
  { id: "d19", title: "Refund — Cancelled", amount: 3475, status: "Success", when: "Jul 14, 2026 · 12:31pm", kind: "refund" },
  { id: "d20", title: "Virtual Number (All)", amount: -3475, status: "Success", when: "Jul 14, 2026 · 12:15pm", kind: "virtual" },
  { id: "d21", title: "Gift Card Sale — iTunes", amount: 133445, status: "Success", when: "Jul 14, 2026 · 12:40pm", kind: "gift" },
  { id: "d22", title: "Wallet Top-up", amount: 50000, status: "Success", when: "Jul 13, 2026 · 9:20am", kind: "topup" },
];

const PAGE_SIZE = 8;

function naira(n: number) {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-NG", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  return (n < 0 ? "-" : n > 0 ? "+" : "") + "\u20a6" + formatted;
}

function TxnIcon({ kind }: { kind: TxnKind }) {
  if (kind === "virtual") {
    return (
      <div className="w-10 h-10 rounded-[12px] bg-[#FEF3C7] flex items-center justify-center shrink-0">
        <Phone size={18} className="text-[#D97706]" />
      </div>
    );
  }
  if (kind === "refund") {
    return (
      <div className="w-10 h-10 rounded-[12px] bg-[#D1FAE5] flex items-center justify-center shrink-0">
        <RotateCcw size={18} className="text-[#059669]" />
      </div>
    );
  }
  if (kind === "gift" || kind === "topup") {
    return (
      <div className="w-10 h-10 rounded-[12px] bg-[#DBEAFE] flex items-center justify-center shrink-0">
        <CreditCard size={18} className="text-[#1877F2]" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-[12px] bg-[#EDE9FE] flex items-center justify-center shrink-0">
      <Rocket size={18} className="text-[#7C3AED]" />
    </div>
  );
}

export default function HistoryPage() {
  const [mode, setMode] = useState<HistMode>("list");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasSupabase, setHasSupabase] = useState(false);

  useEffect(() => {
    const key =
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
      (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
      (typeof window !== "undefined" && (window as unknown as { __SUPABASE_URL__?: string }).__SUPABASE_URL__);
    setHasSupabase(Boolean(key && String(key).length > 8));
  }, []);

  const allTxns = useMemo(() => (hasSupabase ? [] : DEMO_TXNS), [hasSupabase]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allTxns;
    return allTxns.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.when.toLowerCase().includes(q)
    );
  }, [allTxns, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats (demo values matching video when no Supabase)
  const allTimeFunding = hasSupabase ? 0 : 110960.69;
  const monthTopUps = hasSupabase ? 0 : 0;
  const monthSpending = hasSupabase ? 0 : 0;
  const totalPurchases = hasSupabase ? 0 : 0;
  const totalTxns = hasSupabase ? 0 : 0;
  const totalTopUps = hasSupabase ? 0 : 0;
  const totalSpent = hasSupabase ? 0 : 0;
  const purchaseCount = hasSupabase ? 0 : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <header className="sticky top-0 z-30 bg-[#F8FAFC]/95 backdrop-blur-sm px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-[#0F172A]">History</h1>
        <p className="text-sm text-[#64748B] mt-0.5">All transactions & orders</p>
      </header>

      <div className="px-4 pt-2">
        {/* List / Stats toggle */}
        <div className="flex gap-2 p-1 rounded-full bg-[#E8EEF5] mb-3">
          <button
            type="button"
            onClick={() => setMode("list")}
            className={`flex-1 h-10 rounded-full flex items-center justify-center gap-1.5 text-sm font-medium transition ${
              mode === "list" ? "bg-white text-[#1877F2] shadow-sm" : "text-[#64748B]"
            }`}
          >
            <List size={18} />
          </button>
          <button
            type="button"
            onClick={() => setMode("stats")}
            className={`flex-1 h-10 rounded-full flex items-center justify-center gap-1.5 text-sm font-medium transition ${
              mode === "stats" ? "bg-white text-[#1877F2] shadow-sm" : "text-[#64748B]"
            }`}
          >
            <PieChart size={18} />
          </button>
        </div>

        {mode === "list" && (
          <>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search transactions..."
                className="w-full h-11 pl-9 pr-3 rounded-full bg-white border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8] mb-2">All Activity</p>

            {pageItems.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-8 text-center">
                <p className="text-sm text-[#64748B]">No transactions yet</p>
                <p className="text-xs text-[#94A3B8] mt-1">Fund your wallet to get started</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pageItems.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white rounded-[14px] border border-[#E2E8F0] px-3.5 py-3 flex items-center gap-3"
                  >
                    <TxnIcon kind={tx.kind} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{tx.title}</p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">{tx.when}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          tx.amount < 0 ? "text-[#EF4444]" : "text-[#10B981]"
                        }`}
                      >
                        {naira(tx.amount)}
                      </p>
                      <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-medium text-[#10B981]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 pb-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-9 px-3 rounded-full border border-[#E2E8F0] bg-white text-sm text-[#64748B] disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-sm text-[#64748B]">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-9 px-3 rounded-full border border-[#E2E8F0] bg-white text-sm text-[#64748B] disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {mode === "stats" && (
          <div className="space-y-3 pb-4">
            <div className="rounded-[16px] p-4 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#0F172A] text-white">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <CreditCard size={18} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">All-Time Funding</p>
              </div>
              <p className="text-2xl font-bold tabular-nums">{"\u20a6"}{allTimeFunding.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] opacity-70 mt-1">Total deposits ever made</p>
            </div>

            <div className="rounded-[16px] p-4 bg-gradient-to-br from-[#0F172A] via-[#134E4A] to-[#0F172A] text-white">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Upload size={16} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">This Month's Top-Ups</p>
              </div>
              <p className="text-2xl font-bold tabular-nums">{"\u20a6"}{monthTopUps.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] opacity-70 mt-1">September 2026</p>
            </div>

            <div className="rounded-[16px] p-4 bg-gradient-to-br from-[#0F172A] via-[#4C1D95] to-[#0F172A] text-white">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <Upload size={16} className="rotate-180" />
                <p className="text-[11px] font-semibold uppercase tracking-wide">This Month's Spending</p>
              </div>
              <p className="text-2xl font-bold tabular-nums">{"\u20a6"}{monthSpending.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
              <p className="text-[11px] opacity-70 mt-1">September 2026</p>
            </div>

            <div className="rounded-[16px] p-4 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#0F172A] text-white">
              <div className="flex items-center gap-2 mb-2 opacity-80">
                <ShoppingBag size={16} />
                <p className="text-[11px] font-semibold uppercase tracking-wide">Total Purchases</p>
              </div>
              <p className="text-2xl font-bold tabular-nums">{totalPurchases}</p>
              <p className="text-[11px] opacity-70 mt-1">September 2026</p>
            </div>

            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-[#1877F2]" />
                <p className="text-sm font-semibold text-[#0F172A]">September 2026 Summary</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-[10px] bg-[#F8FAFC] px-3 py-2.5">
                  <span className="flex items-center gap-2 text-xs text-[#64748B]">
                    <ArrowLeftRight size={14} /> TOTAL TRANSACTIONS
                  </span>
                  <span className="text-sm font-semibold text-[#0F172A]">{totalTxns}</span>
                </div>
                <div className="flex items-center justify-between rounded-[10px] bg-[#F8FAFC] px-3 py-2.5 border-l-[3px] border-l-[#10B981]">
                  <span className="flex items-center gap-2 text-xs text-[#64748B]">
                    <Plus size={14} className="text-[#10B981]" /> TOTAL TOP-UPS
                  </span>
                  <span className="text-sm font-semibold text-[#0F172A]">{"\u20a6"}{totalTopUps.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between rounded-[10px] bg-[#F8FAFC] px-3 py-2.5 border-l-[3px] border-l-[#EF4444]">
                  <span className="flex items-center gap-2 text-xs text-[#64748B]">
                    <Minus size={14} className="text-[#EF4444]" /> TOTAL SPENT
                  </span>
                  <span className="text-sm font-semibold text-[#0F172A]">{"\u20a6"}{totalSpent.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between rounded-[10px] bg-[#F8FAFC] px-3 py-2.5">
                  <span className="flex items-center gap-2 text-xs text-[#64748B]">
                    <ShoppingBag size={14} /> PURCHASE COUNT
                  </span>
                  <span className="text-sm font-semibold text-[#0F172A]">{purchaseCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
