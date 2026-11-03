"use client";

import { useEffect, useState } from "react";
import {
  Gauge,
  Layers,
  Zap,
  Crown,
  Save,
  Loader2,
  CircleAlert,
  Check,
  Percent,
} from "lucide-react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@/lib/supabase/client";

type TierInfo = {
  id: "economy" | "standard" | "fast" | "premium";
  label: string;
  blurb: string;
  count: number;
  band: { minNgn: number | null; maxNgn: number | null };
};

type PricingData = {
  markups: Record<string, number>;
  persisted: boolean;
  tiers: TierInfo[];
  note: string;
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  economy: <Gauge size={18} strokeWidth={2.3} />,
  standard: <Layers size={18} strokeWidth={2.3} />,
  fast: <Zap size={18} strokeWidth={2.3} />,
  premium: <Crown size={18} strokeWidth={2.3} />,
};

const TIER_ACCENTS: Record<string, string> = {
  economy: "bg-emerald-50 text-emerald-600",
  standard: "bg-blue-50 text-[#1877F2]",
  fast: "bg-violet-50 text-violet-600",
  premium: "bg-amber-50 text-amber-600",
};

function formatNgn(n: number) {
  return Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function BoostPricingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<PricingData | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/boost/pricing", { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setData(payload);
        const d: Record<string, string> = {};
        for (const t of payload.tiers as TierInfo[]) {
          d[t.id] = String(payload.markups?.[t.id] ?? "1.25");
        }
        setDrafts(d);
      } else {
        setError(payload.error || "Could not load pricing.");
      }
    } catch {
      setError("Could not load pricing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!data) return;
    const markups: Record<string, number> = {};
    for (const t of data.tiers) {
      const m = Number(drafts[t.id]);
      if (!Number.isFinite(m) || m < 1 || m > 10) {
        setError(`${t.label} multiplier must be between 1.0 and 10.0.`);
        return;
      }
      markups[t.id] = m;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }
      const res = await fetch("/api/boost/pricing", {
        method: "PUT",
        headers,
        body: JSON.stringify({ markups }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setData((prev) => (prev ? { ...prev, markups: payload.markups, persisted: true } : prev));
        setMessage("Multipliers saved. New boost prices apply within a few minutes.");
      } else {
        setError(payload.error || "Could not save multipliers.");
      }
    } catch {
      setError("Could not save multipliers.");
    } finally {
      setSaving(false);
    }
  }

  const mult = (id: string) => {
    const m = Number(drafts[id]);
    return Number.isFinite(m) && m >= 1 && m <= 10 ? m : 1.25;
  };

  const bandText = (t: TierInfo) => {
    const { minNgn, maxNgn } = t.band ?? {};
    if (minNgn === null && maxNgn !== null) return `Below ₦${formatNgn(maxNgn)}`;
    if (maxNgn === null && minNgn !== null) return `₦${formatNgn(minNgn)} and above`;
    if (minNgn !== null && maxNgn !== null)
      return `₦${formatNgn(minNgn)} – ₦${formatNgn(maxNgn)}`;
    return "—";
  };

  const customerText = (t: TierInfo) => {
    const m = mult(t.id);
    const { minNgn, maxNgn } = t.band ?? {};
    const lo = minNgn === null ? null : Math.round(minNgn * m * 100) / 100;
    const hi = maxNgn === null ? null : Math.round(maxNgn * m * 100) / 100;
    if (lo === null && hi !== null) return `Up to ₦${formatNgn(hi)}`;
    if (hi === null && lo !== null) return `From ₦${formatNgn(lo)}`;
    if (lo !== null && hi !== null) return `₦${formatNgn(lo)} – ₦${formatNgn(hi)}`;
    return "—";
  };

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
            Boost pricing
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] space-y-4 px-4 py-5">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-[20px] border border-[#E2E8F0] bg-white py-10">
            <Loader2 size={16} className="animate-spin text-[#94A3B8]" />
            <span className="text-[12px] font-semibold text-[#64748B]">Loading pricing…</span>
          </div>
        ) : error && !data ? (
          <div className="flex items-center gap-2 rounded-[20px] border border-[#F2D4D1] bg-[#FFF8F7] px-4 py-3 text-[12px] font-semibold text-[#A8463D]">
            <CircleAlert size={15} />
            {error}
          </div>
        ) : data ? (
          <>
            <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2">
                <Percent size={15} className="text-[#64748B]" strokeWidth={2.4} />
                <span className="text-[13px] font-bold text-[#0F172A]">
                  Your pricing multipliers
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                Boost service prices come to you live from Verxor, in Naira. Set
                your multiplier per tier — your customers pay the Verxor price ×
                your multiplier. If the Verxor price ever changes, your prices
                follow automatically and your margin is always preserved.
              </p>

              <div className="mt-4 space-y-3">
                {data.tiers.map((t) => {
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 rounded-2xl border border-[#E8EEF5] bg-[#F8FAFC] px-3.5 py-3"
                    >
                      <span
                        className={
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
                          (TIER_ACCENTS[t.id] || "bg-[#EFF6FF] text-[#1877F2]")
                        }
                      >
                        {TIER_ICONS[t.id]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-extrabold text-[#0F172A]">{t.label}</p>
                        <p className="text-[11px] font-semibold text-[#94A3B8]">
                          {t.count > 0
                            ? `${t.count.toLocaleString("en-NG")} services`
                            : t.blurb}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2">
                        <span className="text-[12px] font-extrabold text-[#94A3B8]">×</span>
                        <input
                          value={drafts[t.id] ?? ""}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [t.id]: e.target.value.replace(/[^0-9.]/g, "") }))
                          }
                          inputMode="decimal"
                          aria-label={`${t.label} multiplier`}
                          className="w-14 border-0 bg-transparent text-center text-[14px] font-extrabold text-[#0F172A] outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="mt-4 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1877F2] px-5 text-[13px] font-extrabold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save multipliers
              </button>

              {message && (
                <p className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
                  <Check size={14} strokeWidth={2.5} />
                  {message}
                </p>
              )}
              {error && (
                <p className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#A8463D]">
                  <CircleAlert size={14} />
                  {error}
                </p>
              )}
            </section>

            <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <span className="text-[13px] font-bold text-[#0F172A]">Price preview</span>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                The Verxor price for each tier, in Naira per 1,000, and what your
                customers pay with your current multiplier. If Verxor prices
                change, these numbers update automatically.
              </p>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8EEF5]">
                <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                  <span className="flex-1">Tier</span>
                  <span className="w-[120px] text-right sm:w-[150px]">Verxor price</span>
                  <span className="w-[50px] text-right">Mult.</span>
                  <span className="w-[130px] text-right sm:w-[160px]">Customers pay</span>
                </div>
                {data.tiers.map((t, i) => {
                  return (
                    <div
                      key={t.id}
                      className={
                        "flex items-center justify-between px-4 py-3 text-[11px] sm:text-[12px] " +
                        (i % 2 === 0 ? "bg-[#F8FAFC]" : "bg-white")
                      }
                    >
                      <span className="flex flex-1 items-center gap-2 font-extrabold text-[#0F172A]">
                        <span
                          className={
                            "flex h-6 w-6 items-center justify-center rounded-lg " +
                            (TIER_ACCENTS[t.id] || "bg-[#EFF6FF] text-[#1877F2]")
                          }
                        >
                          {TIER_ICONS[t.id]}
                        </span>
                        {t.label}
                      </span>
                      <span className="w-[120px] text-right font-extrabold tabular-nums text-[#0F172A] sm:w-[150px]">
                        {bandText(t)}
                      </span>
                      <span className="w-[50px] text-right font-extrabold tabular-nums text-[#94A3B8]">
                        ×{mult(t.id)}
                      </span>
                      <span className="w-[130px] text-right font-extrabold tabular-nums text-[#1877F2] sm:w-[160px]">
                        {customerText(t)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-[#94A3B8]">
                All prices are in Naira, per 1,000. Customers pay = Verxor price × your multiplier.
              </p>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
