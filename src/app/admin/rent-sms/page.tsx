"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  CircleAlert,
  Check,
  PhoneCall,
  Wifi,
  Banknote,
  Gem,
  Wallet,
  ScrollText,
} from "lucide-react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@/lib/supabase/client";

type PricingData = {
  persisted: boolean;
  multiplier: number;
  defaultMultiplier: number;
  min: number;
  max: number;
  note: string;
};

/** Real rentals as priced on verxor.com — NAIRA only. */
const SAMPLES: { icon: number; label: string; verxorNgn: number }[] = [
  { icon: 0, label: "WhatsApp · 1 day", verxorNgn: 2050 },
  { icon: 0, label: "WhatsApp · 30 days", verxorNgn: 9150 },
  { icon: 1, label: "All-Services · 7 days", verxorNgn: 12100 },
  { icon: 1, label: "All-Services · 30 days", verxorNgn: 17250 },
  { icon: 2, label: "All-Services · 1 year", verxorNgn: 103500 },
];

const ICONS = [
  <Wallet size={18} strokeWidth={2.3} key="t0" />,
  <Banknote size={18} strokeWidth={2.3} key="t1" />,
  <Gem size={18} strokeWidth={2.3} key="t2" />,
];
const ACCENTS = [
  "bg-amber-50 text-amber-600",
  "bg-sky-50 text-sky-600",
  "bg-violet-50 text-violet-600",
];

function formatNgn(n: number) {
  return Number(n || 0).toLocaleString("en-NG");
}

function roundUp50(n: number) {
  return Math.max(0, Math.ceil(n / 50) * 50);
}

export default function RentSmsPricingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<PricingData | null>(null);
  const [draft, setDraft] = useState("");
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
      const res = await fetch("/api/rent-sms/pricing", { headers, cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setData(payload);
        setDraft(String(payload.multiplier));
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

  const mult = (() => {
    const m = Number(draft);
    return data && Number.isFinite(m) && m >= data.min && m <= data.max ? m : data?.multiplier ?? 1;
  })();

  async function save() {
    if (!data) return;
    const m = Number(draft);
    if (!Number.isFinite(m) || m < data.min || m > data.max) {
      setError(`Multiplier must be between ${data.min} and ${data.max}.`);
      return;
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
      const res = await fetch("/api/rent-sms/pricing", {
        method: "PUT",
        headers,
        body: JSON.stringify({ multiplier: m }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setMessage("Multiplier saved. New Rent-for-SMS prices apply immediately.");
        await load();
      } else {
        setError(payload.error || "Could not save the multiplier.");
      }
    } catch {
      setError("Could not save the multiplier.");
    } finally {
      setSaving(false);
    }
  }

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
            Rent-for-SMS pricing
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
                <PhoneCall size={15} className="text-[#64748B]" strokeWidth={2.4} />
                <span className="text-[13px] font-bold text-[#0F172A]">
                  How your Rent-for-SMS pricing works
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                Rentals come to you from Verxor already priced in Naira. Your
                customers pay the Verxor retail price × your multiplier, rounded
                up to the nearest ₦50. At ×1.0 you sell at exactly the same
                price as verxor.com. If our price ever changes, your prices
                follow automatically and your margin is always preserved.
              </p>

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#E8EEF5] bg-[#F8FAFC] px-3.5 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <Wallet size={18} strokeWidth={2.3} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-extrabold text-[#0F172A]">Your multiplier</p>
                  <p className="text-[11px] font-semibold text-[#94A3B8]">
                    Verxor retail price × this = what customers pay here
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-2">
                  <span className="text-[12px] font-extrabold text-[#94A3B8]">×</span>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="decimal"
                    aria-label="Rent-for-SMS multiplier"
                    className="w-14 border-0 bg-transparent text-center text-[14px] font-extrabold text-[#0F172A] outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void save()}
                disabled={saving}
                className="mt-4 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1877F2] px-5 text-[13px] font-extrabold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save multiplier
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

              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <ScrollText size={12} />
                {data.persisted
                  ? `Your saved multiplier (×${data.multiplier}) is live on the Rent-for-SMS page right now.`
                  : "No multiplier saved yet — the default (×1.0, same price as verxor.com) is live. Save to use your own."}
              </p>
            </section>

            <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <span className="text-[13px] font-bold text-[#0F172A]">Price preview</span>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                Real rentals with their current Verxor price in Naira, and what
                your customers pay here with your multiplier (rounded up to the
                nearest ₦50).
              </p>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8EEF5]">
                <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                  <span className="flex-1">Rental</span>
                  <span className="w-[110px] text-right sm:w-[140px]">Verxor price</span>
                  <span className="w-[50px] text-right">Mult.</span>
                  <span className="w-[120px] text-right sm:w-[150px]">Customers pay</span>
                </div>
                {SAMPLES.map((s, i) => (
                  <div
                    key={s.label}
                    className={
                      "flex items-center justify-between px-4 py-3 text-[11px] sm:text-[12px] " +
                      (i % 2 === 0 ? "bg-[#F8FAFC]" : "bg-white")
                    }
                  >
                    <span className="flex flex-1 items-center gap-2 font-extrabold text-[#0F172A]">
                      <span className={"flex h-6 w-6 items-center justify-center rounded-lg " + ACCENTS[s.icon]}>
                        {ICONS[s.icon]}
                      </span>
                      {s.label}
                    </span>
                    <span className="w-[110px] text-right font-extrabold tabular-nums text-[#0F172A] sm:w-[140px]">
                      ₦{formatNgn(s.verxorNgn)}
                    </span>
                    <span className="w-[50px] text-right font-extrabold tabular-nums text-[#94A3B8]">
                      ×{mult}
                    </span>
                    <span className="w-[120px] text-right font-extrabold tabular-nums text-[#1877F2] sm:w-[150px]">
                      ₦{formatNgn(roundUp50(s.verxorNgn * mult))}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-[#94A3B8]">
                Choosing a specific state area code costs the same — no extra charge.
              </p>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
