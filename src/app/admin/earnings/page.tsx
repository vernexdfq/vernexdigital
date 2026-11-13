"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  TrendingUp,
  Loader2,
  Wallet,
  ShoppingBag,
  Coins,
  CircleAlert,
} from "lucide-react";
import Link from "next/link";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";

type ServiceRow = {
  key: string;
  label: string;
  orders: number;
  volume: number;
  charge: number;
  profit: number;
  missingCharge: number;
};

type DayRow = {
  date: string;
  orders: number;
  volume: number;
  charge: number;
  profit: number;
};

type EarningsData = {
  today: {
    date: string;
    orders: number;
    totalTransactions: number;
    verxorCharge: number;
    profit: number;
    missingCharge: number;
  };
  services: ServiceRow[];
  history: DayRow[];
};

function formatNgn(n: number) {
  return Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function dayLabel(date: string) {
  if (!date) return "";
  const d = new Date(`${date}T12:00:00Z`);
  return d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
}

export default function DailyEarningsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/admin/earnings", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && payload.ok) {
          setData(payload);
        } else {
          setError(payload.error || "Could not load earnings.");
        }
      } catch {
        if (!cancelled) setError("Could not load earnings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = data?.today;

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-28">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-3 px-4">
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm active:scale-[0.97]"
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </Link>
          <div>
            <h1 className="text-[16px] font-extrabold tracking-tight text-[#0F172A]">
              Daily earnings
            </h1>
            <p className="text-[11px] font-semibold text-[#64748B]">
              Your gain for today, updated live
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 pt-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-[20px] border border-[#E2E8F0] bg-white py-12">
            <Loader2 size={16} className="animate-spin text-[#94A3B8]" />
            <span className="text-[12px] font-semibold text-[#64748B]">Loading earnings…</span>
          </div>
        ) : error && !data ? (
          <div className="flex items-center gap-2 rounded-[20px] border border-[#F2D4D1] bg-[#FFF8F7] px-4 py-3 text-[12px] font-semibold text-[#A8463D]">
            <CircleAlert size={15} />
            {error}
          </div>
        ) : data && today ? (
          <>
            {/* Today's profit — the headline number */}
            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0F172A] px-5 py-5 text-white shadow-[0_12px_32px_rgba(15,23,42,0.22)]">
              <div
                className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-emerald-400/15 blur-2xl"
                aria-hidden
              />
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                <TrendingUp size={13} strokeWidth={2.6} />
                Today&apos;s profit
              </p>
              <p className="mt-2 text-[38px] font-extrabold leading-none tracking-tight tabular-nums text-emerald-300">
                ₦{formatNgn(today.profit)}
              </p>
              <p className="mt-3 text-[12px] font-semibold text-slate-400">
                {today.orders} {today.orders === 1 ? "order" : "orders"} completed today · cashback
                and all gains combined
              </p>
            </div>

            {/* The two numbers behind the profit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[16px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag size={13} className="text-[#1877F2]" strokeWidth={2.5} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Total transactions
                  </p>
                </div>
                <p className="mt-1.5 text-[19px] font-extrabold tabular-nums text-[#0F172A]">
                  ₦{formatNgn(today.totalTransactions)}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-[#94A3B8]">
                  Everything customers bought today
                </p>
              </div>
              <div className="rounded-[16px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-1.5">
                  <Wallet size={13} className="text-[#1877F2]" strokeWidth={2.5} />
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                    Verxor charge
                  </p>
                </div>
                <p className="mt-1.5 text-[19px] font-extrabold tabular-nums text-[#0F172A]">
                  ₦{formatNgn(today.verxorCharge)}
                </p>
                <p className="mt-1 text-[10px] leading-snug text-[#94A3B8]">
                  What Verxor deducted for them
                </p>
              </div>
            </div>

            {today.missingCharge > 0 && (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                <CircleAlert size={15} className="mt-0.5 shrink-0 text-amber-600" />
                <p className="text-[11px] leading-relaxed text-amber-800">
                  {today.missingCharge} of today&apos;s{" "}
                  {today.missingCharge === 1 ? "order has" : "orders have"} no recorded Verxor
                  charge yet, so{" "}
                  {today.missingCharge === 1 ? "it is" : "they are"} not counted in the profit.
                  New orders count automatically.
                </p>
              </div>
            )}

            {/* Services ranked by today's usage */}
            <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-[#475569]" strokeWidth={2.4} />
                <span className="text-[13px] font-bold text-[#0F172A]">
                  Most-used services today
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                The service your customers use most today sits at the top — that&apos;s where
                your money is being made.
              </p>

              {data.services.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[#DCE3EE] bg-[#F8FAFC] px-4 py-5 text-center">
                  <p className="text-[12px] font-semibold text-[#64748B]">
                    No completed orders today yet.
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#94A3B8]">
                    As your customers buy, services appear here ranked by usage.
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8EEF5]">
                  <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                    <span className="flex-1">Service</span>
                    <span className="w-[46px] text-right">Orders</span>
                    <span className="w-[100px] text-right sm:w-[110px]">Customers paid</span>
                    <span className="w-[90px] text-right sm:w-[100px]">Your gain</span>
                  </div>
                  {data.services.map((s, i) => (
                    <div
                      key={s.key}
                      className={
                        "flex items-center justify-between px-4 py-3 text-[11px] sm:text-[12px] " +
                        (i % 2 === 0 ? "bg-[#F8FAFC]" : "bg-white")
                      }
                    >
                      <span className="min-w-0 flex-1 truncate pr-2 font-extrabold text-[#0F172A]">
                        {s.label}
                      </span>
                      <span className="w-[46px] shrink-0 text-right font-extrabold tabular-nums text-[#64748B]">
                        {s.orders}
                      </span>
                      <span className="w-[100px] shrink-0 text-right font-extrabold tabular-nums text-[#0F172A] sm:w-[110px]">
                        ₦{formatNgn(s.volume)}
                      </span>
                      <span className="w-[90px] shrink-0 text-right font-extrabold tabular-nums text-emerald-600 sm:w-[100px]">
                        +₦{formatNgn(s.profit)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Last 14 days */}
            <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <span className="text-[13px] font-bold text-[#0F172A]">Last 14 days</span>
              <div className="mt-3 space-y-2">
                {data.history.map((d) => (
                  <div
                    key={d.date}
                    className={
                      "flex items-center justify-between rounded-2xl px-3.5 py-2.5 " +
                      (d.date === today.date
                        ? "border border-emerald-200 bg-emerald-50"
                        : "border border-[#E8EEF5] bg-[#F8FAFC]")
                    }
                  >
                    <div>
                      <p className="text-[12px] font-extrabold text-[#0F172A]">
                        {d.date === today.date ? "Today" : dayLabel(d.date)}
                      </p>
                      <p className="text-[10px] font-semibold text-[#94A3B8]">
                        {d.orders} {d.orders === 1 ? "order" : "orders"} · ₦{formatNgn(d.volume)}{" "}
                        sales
                      </p>
                    </div>
                    <p
                      className={
                        "text-[13px] font-extrabold tabular-nums " +
                        (d.profit > 0 ? "text-emerald-600" : "text-[#94A3B8]")
                      }
                    >
                      +₦{formatNgn(d.profit)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
