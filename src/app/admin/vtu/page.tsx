"use client";

import { useEffect, useState } from "react";
import {
  Signal,
  Zap,
  Tv,
  Loader2,
  RefreshCw,
  CircleAlert,
  Coins,
} from "lucide-react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@/lib/supabase/client";

type CashbackStat = {
  orders: number;
  volume: number;
  cashback: number;
  ratePct: number | null;
};

type NetworkStat = CashbackStat & { id: string; label: string };

type VtuData = {
  airtime: NetworkStat[];
  electricity: CashbackStat;
  cable_tv: CashbackStat;
};

function formatNgn(n: number) {
  return Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function StatCard({
  icon,
  label,
  stat,
}: {
  icon: React.ReactNode;
  label: string;
  stat: CashbackStat;
}) {
  const hasData = stat.orders > 0;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E8EEF5] bg-[#F8FAFC] px-3.5 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1877F2]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold text-[#0F172A]">{label}</p>
        <p className="text-[11px] font-semibold text-[#94A3B8]">
          {hasData
            ? `${stat.orders} ${stat.orders === 1 ? "order" : "orders"} · ₦${formatNgn(stat.volume)} volume`
            : "No completed orders yet"}
        </p>
      </div>
      <div className="shrink-0 text-right">
        {hasData && stat.ratePct !== null ? (
          <p className="text-[13px] font-extrabold text-emerald-600">
            {stat.ratePct}% cashback
          </p>
        ) : (
          <p className="text-[12px] font-semibold text-[#94A3B8]">Rate shows after first order</p>
        )}
        <p className="text-[11px] font-bold tabular-nums text-[#64748B]">
          ₦{formatNgn(stat.cashback)} earned
        </p>
      </div>
    </div>
  );
}

export default function VtuServicesPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<VtuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }
      const res = await fetch("/api/admin/vtu", { cache: "no-store", headers });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setData({ airtime: payload.airtime, electricity: payload.electricity, cable_tv: payload.cable_tv });
      } else {
        setError(payload.error || "Could not load cashback.");
      }
    } catch {
      setError("Could not load cashback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const totalCashback =
    (data?.airtime.reduce((sum, n) => sum + n.cashback, 0) ?? 0) +
    (data?.electricity.cashback ?? 0) +
    (data?.cable_tv.cashback ?? 0);

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#E2E8F0] bg-white/90 px-4 py-4 backdrop-blur">
        <AdminMenuButton onClick={() => setMenuOpen(true)} />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
            Vernex Admin
          </p>
          <h1 className="text-[17px] font-extrabold tracking-tight text-[#0F172A]">
            VTU services
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] space-y-4 px-4 py-5">
        <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-[#475569]" strokeWidth={2.4} />
              <span className="text-[13px] font-bold text-[#0F172A]">
                Your cashback rates
              </span>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#DCE3EE] bg-white px-3 text-[12px] font-bold text-[#1877F2] shadow-sm active:scale-[0.98]"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
            Cashback is applied by Verxor at checkout — customers pay face value and
            you keep the difference. Rates below are calculated from your completed
            orders.
          </p>

          {error ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[#F2D4D1] bg-[#FFF8F7] px-4 py-3 text-[12px] font-semibold text-[#A8463D]">
              <CircleAlert size={15} />
              {error}
            </div>
          ) : loading ? (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-[#E8EEF5] bg-[#F8FAFC] py-6">
              <Loader2 size={16} className="animate-spin text-[#94A3B8]" />
              <span className="text-[12px] font-semibold text-[#64748B]">Loading cashback…</span>
            </div>
          ) : data ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">
                  Airtime
                </p>
                <div className="space-y-2.5">
                  {data.airtime.map((n) => (
                    <StatCard
                      key={n.id}
                      icon={<Signal size={17} strokeWidth={2.3} />}
                      label={n.label}
                      stat={n}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 px-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#94A3B8]">
                  Bills
                </p>
                <div className="space-y-2.5">
                  <StatCard
                    icon={<Zap size={17} strokeWidth={2.3} />}
                    label="Electricity"
                    stat={data.electricity}
                  />
                  <StatCard
                    icon={<Tv size={17} strokeWidth={2.3} />}
                    label="TV subscription"
                    stat={data.cable_tv}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3">
                <p className="text-[12px] font-extrabold text-emerald-700">
                  Total cashback earned
                </p>
                <p className="text-[15px] font-extrabold tabular-nums text-emerald-700">
                  ₦{formatNgn(totalCashback)}
                </p>
              </div>
              <p className="pt-1 text-center text-[11px] text-[#94A3B8]">
                Data bundle cashback will appear here once the data service goes live.
              </p>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
