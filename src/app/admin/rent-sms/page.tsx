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
  Wallet2,
} from "lucide-react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@/lib/supabase/client";

type Sample = {
  label: string;
  tier: number;
  wholesaleNgn: number;
  verxorRetailNgn: number;
  customerNgn: number;
};

type PricingData = {
  persisted: boolean;
  multipliers: number[];
  defaultMultipliers: number[];
  min: number;
  max: number;
  tiers: { label: string; hint: string; multiplier: number }[];
  samples: Sample[];
  note: string;
};

const ICONS = [
  <Wallet size={18} strokeWidth={2.3} key="t0" />,
  <Wifi size={18} strokeWidth={2.3} key="t1" />,
  <Banknote size={18} strokeWidth={2.3} key="t2" />,
  <Gem size={18} strokeWidth={2.3} key="t3" />,
  <Wallet2 size={18} strokeWidth={2.3} key="t4" />,
];
const ACCENTS = [
  "bg-amber-50 text-amber-600",
  "bg-sky-50 text-sky-600",
  "bg-emerald-50 text-emerald-600",
  "bg-violet-50 text-violet-600",
  "bg-rose-50 text-rose-600",
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
  const [drafts, setDrafts] = useState<string[]>(["", "", "", "", ""]);
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
        setDrafts((payload.multipliers as number[]).map((m) => String(m)));
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

  const mult = (i: number) => {
    const m = Number(drafts[i]);
    const d = data?.defaultMultipliers[i] ?? RENT_SMS_FALLBACK[i];
    return Number.isFinite(m) && m >= 1 && m <= 5 ? m : d;
  };

  async function save() {
    if (!data) return;
    const next: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      const m = Number(drafts[i]);
      if (!Number.isFinite(m) || m < data.min || m > data.max) {
        setError(`${data.tiers[i].label} multiplier must be between ${data.min} and ${data.max}.`);
        return;
      }
      next.push(m);
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
        body: JSON.stringify({ multipliers: next }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setMessage("Multipliers saved. New Rent-for-SMS prices apply immediately.");
        await load();
      } else {
        setError(payload.error || "Could not save the multipliers.");
      }
    } catch {
      setError("Could not save the multipliers.");
    } finally {
      setSaving(false);
    }
  }

  const liveDraftSample = (s: Sample) => {
    const wholesaleApprox = Math.round(s.verxorRetailNgn / (data?.defaultMultipliers[s.tier - 1] ?? 1));
    return roundUp50(Math.max(wholesaleApprox, 1) * mult(s.tier - 1));
  };

  const draftSample = (s: Sample) => roundUp50(s.wholesaleNgn * mult(s.tier - 1));

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
                Verxor charges you a panel-tier wholesale price in Naira, tiered by what
                each line costs. Your customers pay{" "}
                <strong>your Verxor charge × the tier multiplier</strong>, rounded up to
                the nearest ₦50. The defaults (Verxor retail ÷ Verxor panel) sell at
                exactly the same price as verxor.com — raise a multiplier to earn more
                on that tier.
              </p>

              <div className="mt-4 space-y-3">
                {data.tiers.map((t, i) => (
                  <div
                    key={t.label}
                    className="flex items-center gap-3 rounded-2xl border border-[#E8EEF5] bg-[#F8FAFC] px-3.5 py-3"
                  >
                    <span
                      className={
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + ACCENTS[i]
                      }
                    >
                      {ICONS[i]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-extrabold text-[#0F172A]">{t.label}</p>
                      <p className="text-[11px] font-semibold text-[#94A3B8]">{t.hint}</p>
                      <p className="text-[10px] font-semibold text-[#CBD5E1]">
                        default ×{data.defaultMultipliers[i]} (= verxor.com price)
                      </p>
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

              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                <ScrollText size={12} />
                {data.persisted
                  ? "Your saved multipliers are live on the Rent-for-SMS page right now."
                  : "No multipliers saved yet — the defaults (same price as verxor.com) are live. Save to use your own."}
              </p>
            </section>

            <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <span className="text-[13px] font-bold text-[#0F172A]">Live price preview</span>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                Real rentals quoted live from Verxor: what they charge you in Naira, the
                verxor.com price, and what your customers pay with the multipliers in the
                boxes above (rounded up to the nearest ₦50).
              </p>

              {data.samples.length === 0 ? (
                <p className="mt-4 text-[12px] font-semibold text-[#A8463D]">
                  Live quotes are unavailable right now — pricing still works, preview will return shortly.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8EEF5]">
                  <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                    <span className="flex-1">Rental</span>
                    <span className="w-[90px] text-right sm:w-[110px]">Verxor charges you</span>
                    <span className="w-[90px] text-right sm:w-[110px]">verxor.com price</span>
                    <span className="w-[120px] text-right sm:w-[150px]">Customers pay (you)</span>
                  </div>
                  {data.samples.map((s, i) => (
                    <div
                      key={s.label}
                      className={
                        "flex items-center justify-between px-4 py-3 text-[11px] sm:text-[12px] " +
                        (i % 2 === 0 ? "bg-[#F8FAFC]" : "bg-white")
                      }
                    >
                      <span className="flex flex-1 items-center gap-2 font-extrabold text-[#0F172A]">
                        <span className={"flex h-6 w-6 items-center justify-center rounded-lg " + ACCENTS[s.tier - 1]}>
                          {ICONS[s.tier - 1]}
                        </span>
                        {s.label}
                      </span>
                      <span className="w-[90px] text-right font-extrabold tabular-nums text-[#0F172A] sm:w-[110px]">
                        ₦{formatNgn(s.wholesaleNgn)}
                      </span>
                      <span className="w-[90px] text-right font-extrabold tabular-nums text-[#94A3B8] sm:w-[110px]">
                        ₦{formatNgn(s.verxorRetailNgn)}
                      </span>
                      <span className="w-[120px] text-right font-extrabold tabular-nums text-[#1877F2] sm:w-[150px]">
                        ₦{formatNgn(draftSample(s))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] text-[#94A3B8]">
                Choosing a specific state area code costs the same — no extra charge.
                Every price is recomputed live at checkout, so editing here never breaks an order.
              </p>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

const RENT_SMS_FALLBACK = [1.44, 1.23, 1.14, 1.08, 1.07];
