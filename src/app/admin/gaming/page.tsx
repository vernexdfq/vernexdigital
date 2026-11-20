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
  Gamepad2,
} from "lucide-react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@/lib/supabase/client";

type TierInfo = {
  id: "t1" | "t2" | "t3" | "t4";
  label: string;
  blurb: string;
  band: { minNgn: number | null; maxNgn: number | null; sampleNgn: number };
};

type PricingData = {
  markups: Record<string, number>;
  persisted: boolean;
  tiers: TierInfo[];
  note: string;
};

const TIER_ICONS: Record<string, React.ReactNode> = {
  t1: <Gauge size={18} strokeWidth={2.3} />,
  t2: <Layers size={18} strokeWidth={2.3} />,
  t3: <Zap size={18} strokeWidth={2.3} />,
  t4: <Crown size={18} strokeWidth={2.3} />,
};

const TIER_ACCENTS: Record<string, string> = {
  t1: "bg-emerald-50 text-emerald-600",
  t2: "bg-blue-50 text-[#1877F2]",
  t3: "bg-violet-50 text-violet-600",
  t4: "bg-amber-50 text-amber-600",
};

function formatNgn(n: number) {
  return Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function GamingPricingPage() {
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
      const res = await fetch("/api/gaming/pricing", { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setData(payload);
        const d: Record<string, string> = {};
        for (const t of payload.tiers as TierInfo[]) {
          d[t.id] = String(payload.markups?.[t.id] ?? "1.20");
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
      const res = await fetch("/api/gaming/pricing", {
        method: "PUT",
        headers,
        body: JSON.stringify({ markups }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setData((prev) => (prev ? { ...prev, markups: payload.markups, persisted: true } : prev));
        setMessage("Multipliers saved. New gaming prices apply immediately.");
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
    return Number.isFinite(m) && m >= 1 && m <= 10 ? m : 1.2;
  };

  const bandText = (t: TierInfo) => t.blurb || "—";

  const customerText = (t: TierInfo) => {
    const m = mult(t.id);
    const sample = t.band?.sampleNgn ?? 0;
    return `₦${formatNgn(Math.ceil(sample * m))}`;
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
            Gaming pricing
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
            {!data.persisted && (
              <div className="flex items-start gap-2 rounded-[16px] border border-[#FDF0B4] bg-[#FFFBEB] px-4 py-3 text-[11px] font-semibold leading-relaxed text-[#92600A]">
                <CircleAlert size={15} className="mt-0.5 shrink-0" />
                Showing default multipliers — nothing saved yet. Save once to make your pricing official.
              </div>
            )}

            <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2">
                <Gamepad2 size={15} className="text-[#64748B]" strokeWidth={2.4} />
                <span className="text-[13px] font-bold text-[#0F172A]">
                  Your pricing multipliers
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                Gaming top-up prices come to you live from Verxor, in Naira. Set
                your multiplier per price band — your customers pay the Verxor
                price × your multiplier (rounded up to ₦1). If the Verxor price
                ever changes, your prices follow automatically and your margin
                is always preserved.
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
                          {t.blurb}
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
                An example Verxor price in each band, and what your customers
                pay with your current multiplier. If Verxor prices change, these
                numbers update automatically.
              </p>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8EEF5]">
                <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                  <span className="flex-1">Band</span>
                  <span className="w-[120px] text-right">Verxor price range</span>
                  <span className="w-[50px] text-right">Mult.</span>
                  <span className="w-[130px] text-right">Example, customers pay</span>
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
                      <span className="w-[120px] text-right font-extrabold tabular-nums text-[#0F172A]">
                        {bandText(t)}
                      </span>
                      <span className="w-[50px] text-right font-extrabold tabular-nums text-[#94A3B8]">
                        ×{mult(t.id)}
                      </span>
                      <span className="flex w-[130px] justify-end gap-1.5 text-right font-extrabold tabular-nums text-[#1877F2]">
                        {customerText(t)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-[#94A3B8]">
                All prices are in Naira. Customers pay = Verxor price × your multiplier, rounded up to ₦1.
              </p>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
