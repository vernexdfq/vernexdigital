"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  User,
  Wallet,
  Ban,
  CheckCircle2,
  X,
} from "lucide-react";

type Status = "active" | "suspended" | "low";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  balance: number;
  spent: number;
  joined: string;
  status: Status;
  referral?: string;
  note?: string;
};

const DEMO: Customer[] = [
  {
    id: "U-1001",
    name: "Adaobi Okeke",
    email: "adaobi@email.com",
    phone: "08031234567",
    balance: 24500,
    spent: 182000,
    joined: "2026-03-12",
    status: "active",
    referral: "E2637BDA",
  },
  {
    id: "U-1002",
    name: "Chinedu Bassey",
    email: "chinedu.b@gmail.com",
    phone: "08145551234",
    balance: 800,
    spent: 45000,
    joined: "2026-05-02",
    status: "low",
  },
  {
    id: "U-1003",
    name: "Fatima Yusuf",
    email: "fatima.y@outlook.com",
    phone: "07081239876",
    balance: 0,
    spent: 12000,
    joined: "2026-06-18",
    status: "suspended",
    note: "Suspected abuse — failed OTP spam",
  },
  {
    id: "U-1004",
    name: "Tunde Adebayo",
    email: "tunde@yahoo.com",
    phone: "09012345678",
    balance: 156000,
    spent: 410000,
    joined: "2026-01-28",
    status: "active",
  },
  {
    id: "U-1005",
    name: "Grace Nwosu",
    email: "grace.n@email.com",
    phone: "08190001122",
    balance: 3200,
    spent: 28000,
    joined: "2026-07-04",
    status: "active",
  },
];

function naira(n: number) {
  return `₦${n.toLocaleString()}`;
}

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [users, setUsers] = useState(DEMO);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [adjustAmt, setAdjustAmt] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const list = useMemo(() => {
    return users.filter((u) => {
      const matchQ =
        !q ||
        [u.name, u.email, u.phone, u.id].some((x) =>
          x.toLowerCase().includes(q.toLowerCase())
        );
      const matchF = filter === "all" || u.status === filter;
      return matchQ && matchF;
    });
  }, [users, q, filter]);

  function toggleSuspend(id: string) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              status: u.status === "suspended" ? (u.balance < 1000 ? "low" : "active") : "suspended",
            }
          : u
      )
    );
    setSelected((s) =>
      s && s.id === id
        ? {
            ...s,
            status:
              s.status === "suspended" ? (s.balance < 1000 ? "low" : "active") : "suspended",
          }
        : s
    );
  }

  function applyAdjust() {
    if (!selected) return;
    const amt = Number(adjustAmt);
    if (!amt || amt <= 0 || !adjustReason.trim()) return;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== selected.id) return u;
        const next =
          adjustType === "credit"
            ? u.balance + amt
            : Math.max(0, u.balance - amt);
        return {
          ...u,
          balance: next,
          status: u.status === "suspended" ? "suspended" : next < 1000 ? "low" : "active",
        };
      })
    );
    setSelected((s) =>
      s
        ? {
            ...s,
            balance:
              adjustType === "credit"
                ? s.balance + amt
                : Math.max(0, s.balance - amt),
          }
        : s
    );
    setAdjustOpen(false);
    setAdjustAmt("");
    setAdjustReason("");
  }

  const statusChip = (s: Status) => {
    if (s === "active")
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          Active
        </span>
      );
    if (s === "suspended")
      return (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
          Suspended
        </span>
      );
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
        Low balance
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-16">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-[#64748B]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Users</h1>
      </header>

      <div className="px-4 pt-4 max-w-lg mx-auto space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone, ID"
            className="w-full h-11 pl-9 pr-3 rounded-[12px] border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#1877F2]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "active", "suspended", "low"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
                filter === f
                  ? "bg-[#1877F2] text-white border-[#1877F2]"
                  : "bg-white text-[#64748B] border-[#E2E8F0]"
              }`}
            >
              {f === "all" ? "All" : f === "low" ? "Low balance" : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {list.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelected(u)}
              className="w-full text-left bg-white border border-[#E2E8F0] rounded-[14px] p-4 hover:border-[#1877F2]/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1877F2] font-semibold text-sm shrink-0">
                  {u.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{u.name}</p>
                    {statusChip(u.status)}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5 truncate">{u.email}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[#0F172A] font-medium">{naira(u.balance)}</span>
                    <span className="text-[#94A3B8]">Spent {naira(u.spent)}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
          {list.length === 0 && (
            <p className="text-center text-sm text-[#94A3B8] py-10">No users match your search.</p>
          )}
        </div>
      </div>

      {/* Detail sheet */}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setSelected(null);
              setAdjustOpen(false);
            }}
            aria-label="Close"
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-[20px] sm:rounded-[20px] max-h-[88vh] overflow-y-auto p-5 pb-8">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1877F2] font-bold">
                  {selected.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <p className="text-base font-semibold text-[#0F172A]">{selected.name}</p>
                  <p className="text-xs text-[#64748B]">{selected.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setAdjustOpen(false);
                }}
                className="p-1 text-[#94A3B8]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2">{statusChip(selected.status)}</div>

            <div className="mt-4 space-y-3">
              <section className="bg-[#F8FAFC] rounded-[12px] p-3.5 space-y-2">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Identity</p>
                <Row label="Email" value={selected.email} />
                <Row label="Phone" value={selected.phone} />
                <Row label="Joined" value={selected.joined} />
                {selected.referral && <Row label="Referral" value={selected.referral} />}
                {selected.note && <Row label="Note" value={selected.note} />}
              </section>

              <section className="bg-[#F8FAFC] rounded-[12px] p-3.5 space-y-2">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Wallet</p>
                <Row label="Balance" value={naira(selected.balance)} bold />
                <Row label="Total spent" value={naira(selected.spent)} />
              </section>

              {!adjustOpen ? (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("credit");
                      setAdjustOpen(true);
                    }}
                    className="h-11 rounded-full bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Wallet size={16} /> Credit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustType("debit");
                      setAdjustOpen(true);
                    }}
                    className="h-11 rounded-full border border-[#E2E8F0] text-[#0F172A] text-sm font-semibold"
                  >
                    Debit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSuspend(selected.id)}
                    className={`col-span-2 h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 ${
                      selected.status === "suspended"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-red-50 text-red-700 border border-red-100"
                    }`}
                  >
                    {selected.status === "suspended" ? (
                      <>
                        <CheckCircle2 size={16} /> Unsuspend
                      </>
                    ) : (
                      <>
                        <Ban size={16} /> Suspend user
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="border border-[#E2E8F0] rounded-[14px] p-4 space-y-3">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {adjustType === "credit" ? "Credit wallet" : "Debit wallet"}
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={adjustAmt}
                    onChange={(e) => setAdjustAmt(e.target.value)}
                    placeholder="Amount (₦)"
                    className="w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
                  />
                  <input
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Reason (required)"
                    className="w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustOpen(false)}
                      className="flex-1 h-11 rounded-full border border-[#E2E8F0] text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={applyAdjust}
                      className="flex-1 h-11 rounded-full bg-[#1877F2] text-white text-sm font-semibold"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-[#64748B]">{label}</span>
      <span className={`text-right text-[#0F172A] ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
