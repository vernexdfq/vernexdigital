"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

type TxStatus = "success" | "pending" | "failed" | "refunded";

type OrderRow = {
  id: string;
  time: string;
  user: string;
  service: string;
  amount: number;
  status: TxStatus;
  ref: string;
};

type FundRow = {
  id: string;
  time: string;
  user: string;
  method: string;
  amount: number;
  status: TxStatus;
  ref: string;
};

const ORDERS: OrderRow[] = [
  {
    id: "O1",
    time: "Today · 14:22",
    user: "Adaobi Okeke",
    service: "Virtual Number · WhatsApp NG",
    amount: 650,
    status: "success",
    ref: "ORD-9F2A1",
  },
  {
    id: "O2",
    time: "Today · 12:05",
    user: "Tunde Adebayo",
    service: "SMM · IG Followers 1k",
    amount: 2800,
    status: "pending",
    ref: "ORD-8C441",
  },
  {
    id: "O3",
    time: "Yesterday · 19:40",
    user: "Grace Nwosu",
    service: "Rent a Line · 24h",
    amount: 1800,
    status: "success",
    ref: "ORD-7B190",
  },
  {
    id: "O4",
    time: "Yesterday · 09:11",
    user: "Chinedu Bassey",
    service: "Virtual Number · Telegram",
    amount: 650,
    status: "failed",
    ref: "ORD-6A002",
  },
  {
    id: "O5",
    time: "22 Sep · 16:30",
    user: "Fatima Yusuf",
    service: "Gift Card · iTunes $50",
    amount: 72000,
    status: "refunded",
    ref: "ORD-5Z881",
  },
];

const FUNDS: FundRow[] = [
  {
    id: "F1",
    time: "Today · 11:02",
    user: "Adaobi Okeke",
    method: "Paystack",
    amount: 20000,
    status: "success",
    ref: "PAY-4412",
  },
  {
    id: "F2",
    time: "Yesterday · 18:15",
    user: "Tunde Adebayo",
    method: "Bank transfer",
    amount: 50000,
    status: "success",
    ref: "BNK-9921",
  },
  {
    id: "F3",
    time: "21 Sep · 08:44",
    user: "Grace Nwosu",
    method: "Flutterwave",
    amount: 10000,
    status: "pending",
    ref: "FLW-1103",
  },
];

function naira(n: number) {
  return `₦${n.toLocaleString()}`;
}

function StatusChip({ s }: { s: TxStatus }) {
  const map = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    failed: "bg-red-50 text-red-700 border-red-100",
    refunded: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[s]}`}>
      {s[0].toUpperCase() + s.slice(1)}
    </span>
  );
}

export default function AdminTransactionsPage() {
  const [tab, setTab] = useState<"orders" | "funding">("orders");
  const [q, setQ] = useState("");

  const orders = useMemo(() => {
    if (!q) return ORDERS;
    const s = q.toLowerCase();
    return ORDERS.filter(
      (o) =>
        o.user.toLowerCase().includes(s) ||
        o.ref.toLowerCase().includes(s) ||
        o.service.toLowerCase().includes(s)
    );
  }, [q]);

  const funds = useMemo(() => {
    if (!q) return FUNDS;
    const s = q.toLowerCase();
    return FUNDS.filter(
      (f) =>
        f.user.toLowerCase().includes(s) ||
        f.ref.toLowerCase().includes(s) ||
        f.method.toLowerCase().includes(s)
    );
  }, [q]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-16">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-[#64748B]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Transactions</h1>
      </header>

      <div className="px-4 pt-4 max-w-lg mx-auto space-y-3">
        <div className="flex p-1 bg-[#E8EEF7] rounded-full">
          {(["orders", "funding"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 h-9 rounded-full text-xs font-semibold transition-colors ${
                tab === t ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"
              }`}
            >
              {t === "orders" ? "Orders" : "Wallet funding"}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reference, user, service"
            className="w-full h-11 pl-9 pr-3 rounded-[12px] border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#1877F2]"
          />
        </div>

        {tab === "orders" ? (
          <div className="space-y-2.5">
            {orders.map((o) => (
              <div
                key={o.id}
                className="bg-white border border-[#E2E8F0] rounded-[14px] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{o.service}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{o.user}</p>
                  </div>
                  <StatusChip s={o.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">{o.time}</span>
                  <span className="font-semibold text-[#0F172A]">{naira(o.amount)}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#94A3B8]">Ref · {o.ref}</p>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-center text-sm text-[#94A3B8] py-10">No orders found.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {funds.map((f) => (
              <div
                key={f.id}
                className="bg-white border border-[#E2E8F0] rounded-[14px] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A]">{f.user}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{f.method}</p>
                  </div>
                  <StatusChip s={f.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">{f.time}</span>
                  <span className="font-semibold text-emerald-600">{naira(f.amount)}</span>
                </div>
                <p className="mt-1 text-[11px] text-[#94A3B8]">Ref · {f.ref}</p>
              </div>
            ))}
            {funds.length === 0 && (
              <p className="text-center text-sm text-[#94A3B8] py-10">No funding records.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
