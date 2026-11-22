"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  CircleAlert,
  Check,
  ScrollText,
  Wallet,
  Banknote,
  Gem,
} from "lucide-react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@/lib/supabase/client";

type TierInfo = {
  id: number;
  label: string;
  band: string;
  multiplier: number;
  sampleParentNgn: number;
  sampleWholesaleNgn: number;
  sampleRetailNgn: number;
};

type PricingData = {
  persisted: boolean;
  retail: number[];
  defaultRetail: number[];
  usdRate: number;
  tiers: TierInfo[];
  note: string;
};

const TIER_ICONS: React.ReactNode[] = [
  <Wallet size={18} strokeWidth={2.3} key="t0" />,
  <Banknote size={18} strokeWidth={2.3} key="t1" />,
  <Gem size={18} strokeWidth={2.3} key="t2" />,
];

const TIER_ACCENTS: string[] = [
  "bg-emerald-50 text-emerald-600",
  "bg-blue-50 text-[#1877F2]",
  "bg-violet-50 text-violet-600",
];

function formatNgn(n: number) {
  return Number(n || 0).toLocaleString("en-NG");
}

export default function LogsPricingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<PricingData | null>(null);
  const [drafts, setDrafts] = useState<string[]>(["", "", ""]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
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
      const res = await fetch("/api/logs/pricing", { headers, cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setData(payload);
        setDrafts((payload.retail as number[]).map((m) => String(m)));
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
    const retail: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      const m = Number(drafts[i]);
      if (!Number.isFinite(m) || m < 1 || m > 20) {
        setError(`${data.tiers[i].label} multiplier must be between 1.0 and 20.0.`);
        return;
      }
      retail.push(m);
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
      const res = await fetch("/api/logs/pricing", {
        method: "PUT",
        headers,
        body: JSON.stringify({ retail }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setData((prev) =>
          prev ? { ...prev, retail: payload.retail, persisted: true } : prev,
        );
        setMessage("Multipliers saved. New Buy Logs prices apply immediately.");
        await load();
      } else {
        setError(payload.error || "Could not save multipliers.");
      }
    } catch {
      setError("Could not save multipliers.");
    } finally {
      setSaving(false);
    }
  }

  const mult = (i: number) => {
    const m = Number(drafts[i]);
    return Number.isFinite(m) && m >= 1 && m <= 20 ? m : data?.defaultRetail[i] ?? 2;
  };

  const sampleText = (t: TierInfo, i: number) => {
    const m = mult(i);
    return `₦${formatNgn(t.sampleWholesaleNgn)} → ₦${formatNgn(
      Math.max(1, Math.round(t.sampleWholesaleNgn * m)),
    )}`;
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
            Buy Logs pricing
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
                <ScrollText size={15} className="text-[#64748B]" strokeWidth={2.4} />
                <span className="text-[13px] font-bold text-[#0F172A]">
                  Your pricing multipliers
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                Buy Logs listings come to you from Verxor at wholesale cost. Your
                customers pay that wholesale cost × your multiplier, by tier based on
                the wholesale USD value of one account. If the Verxor price ever
                changes, your prices follow automatically and your margin is always
                preserved.
              </p>

              <div className="mt-4 space-y-3">
                {data.tiers.map((t, i) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#E8EEF5] bg-[#F8FAFC] px-3.5 py-3"
                  >
                    <span
                      className={
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " +
                        TIER_ACCENTS[i]
                      }
                    >
                      {TIER_ICONS[i]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-extrabold text-[#0F172A]">{t.label}</p>
                      <p className="text-[11px] font-semibold text-[#94A3B8]">{t.band}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2">
                      <span className="text-[12px] font-extrabold text-[#94A3B8]">×</span>
                      <input
                        value={drafts[i] ?? ""}
                        onChange={(e) =>
                          setDrafts((prev) => {
                            const next = [...prev];
                            next[i] = e.target.value.replace(/[^0-9.]/g, "");
                            return next;
                          })
                        }
                        inputMode="decimal"
                        aria-label={`${t.label} multiplier`}
                        className="w-14 border-0 bg-transparent text-center text-[14px] font-extrabold text-[#0F172A] outline-none"
                      />
                    </div>
                  </div>
                ))}
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
                A sample listing in each tier: what Verxor charges you (wholesale)
                and what your customers pay with your current multiplier. USD rate
                ₦{formatNgn(data.usdRate)}.
              </p>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8EEF5]">
                <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                  <span className="flex-1">Tier</span>
                  <span className="w-[110px] text-right sm:w-[140px]">Wholesale cost</span>
                  <span className="w-[50px] text-right">Mult.</span>
                  <span className="w-[120px] text-right sm:w-[150px]">Customers pay</span>
                </div>
                {data.tiers.map((t, i) => (
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
                          "flex h-6 w-6 items-center justify-center rounded-lg " + TIER_ACCENTS[i]
                        }
                      >
                        {TIER_ICONS[i]}
                      </span>
                      {t.label}
                    </span>
                    <span className="w-[110px] text-right font-extrabold tabular-nums text-[#0F172A] sm:w-[140px]">
                      ₦{formatNgn(t.sampleWholesaleNgn)}
                    </span>
                    <span className="w-[50px] text-right font-extrabold tabular-nums text-[#94A3B8]">
                      ×{mult(i)}
                    </span>
                    <span className="w-[120px] text-right font-extrabold tabular-nums text-[#1877F2] sm:w-[150px]">
                      {sampleText(t, i)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-[#94A3B8]">
                {data.persisted
                  ? "Your saved multipliers are live on the Buy Logs page right now."
                  : "No multipliers saved yet — the defaults (×2.0 / ×1.6 / ×1.22) are live. Save to use your own."}
              </p>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
