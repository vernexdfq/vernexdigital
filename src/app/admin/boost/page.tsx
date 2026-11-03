"use client";

import { useEffect, useState } from "react";
import {
  Percent,
  Save,
  Loader2,
  CircleAlert,
  Check,
  Lock,
} from "lucide-react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@/lib/supabase/client";

type PartnerMult = { label: string; band: string; mult: number };

type PricingData = {
  markup: number;
  persisted: boolean;
  partnerMults: PartnerMult[];
  note: string;
};

const TIER_BLURBS: Record<string, string> = {
  Economy: "Cheapest services",
  Standard: "Mid-range services",
  Fast: "Faster delivery services",
  Premium: "Highest quality services",
};

function formatNgn(n: number) {
  return Number(n || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* Example wholesale prices per 1,000, in Naira — the price coming from Verxor. */
const EXAMPLES = [500, 1000, 2500, 5000];

export default function BoostPricingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<PricingData | null>(null);
  const [markupPct, setMarkupPct] = useState("25");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/boost/pricing", { cache: "no-store" });
        const payload = await res.json().catch(() => ({}));
        if (res.ok && payload.ok) {
          setData(payload);
          setMarkupPct(String(Math.round(Number(payload.markup) * 10000) / 100));
        } else {
          setError(payload.error || "Could not load pricing.");
        }
      } catch {
        setError("Could not load pricing.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    const pct = Number(markupPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 500) {
      setError("Markup must be between 0% and 500%.");
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
      const res = await fetch("/api/boost/pricing", {
        method: "PUT",
        headers,
        body: JSON.stringify({ markup: pct / 100 }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setData((prev) => (prev ? { ...prev, markup: Number(payload.markup), persisted: true } : prev));
        setMessage("Markup saved. New boost prices apply within a few minutes.");
      } else {
        setError(payload.error || "Could not save markup.");
      }
    } catch {
      setError("Could not save markup.");
    } finally {
      setSaving(false);
    }
  }

  const currentMarkup = Number(markupPct) || 0;

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
                <Lock size={15} className="text-[#64748B]" strokeWidth={2.4} />
                <span className="text-[13px] font-bold text-[#0F172A]">
                  Wholesale price from Verxor (locked)
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                What you pay per 1,000, in Naira, by service tier. If the Verxor
                Naira rate ever changes, all prices update automatically — your
                markup and margin stay exactly as you set them.
              </p>
              <div className="mt-3 overflow-hidden rounded-2xl border border-[#E8EEF5]">
                {data.partnerMults.map((m, i) => (
                  <div
                    key={m.label}
                    className={
                      "flex items-center justify-between px-4 py-3 text-[12px] " +
                      (i % 2 === 0 ? "bg-[#F8FAFC]" : "bg-white")
                    }
                  >
                    <div>
                      <p className="font-extrabold text-[#0F172A]">{m.label}</p>
                      <p className="text-[11px] font-semibold text-[#94A3B8]">
                        {TIER_BLURBS[m.label] || "Services"}
                      </p>
                    </div>
                    <p className="font-extrabold tabular-nums text-[#1877F2]">× {m.mult}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2">
                <Percent size={15} className="text-[#64748B]" strokeWidth={2.4} />
                <span className="text-[13px] font-bold text-[#0F172A]">
                  Your markup to customers
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                Customers pay: the Naira price from Verxor × (1 + markup). Change
                it any time — new prices apply to the boost catalog within a few
                minutes.
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-[#FBFCFE] px-4 py-3">
                  <input
                    value={markupPct}
                    onChange={(e) => setMarkupPct(e.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="decimal"
                    aria-label="Markup percent"
                    className="w-full min-w-0 border-0 bg-transparent text-[15px] font-extrabold text-[#0F172A] outline-none"
                  />
                  <span className="text-[14px] font-extrabold text-[#94A3B8]">%</span>
                </div>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="inline-flex h-[50px] shrink-0 items-center gap-2 rounded-2xl bg-[#1877F2] px-5 text-[13px] font-extrabold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  Save
                </button>
              </div>

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
              <span className="text-[13px] font-bold text-[#0F172A]">
                Price preview
              </span>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#64748B]">
                Example prices per 1,000, all in Naira, at your current markup
                ({currentMarkup}%).
              </p>
              <div className="mt-3 overflow-hidden rounded-2xl border border-[#E8EEF5]">
                <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">
                  <span>You pay Verxor</span>
                  <span>Customer pays you</span>
                  <span>Your margin</span>
                </div>
                {EXAMPLES.map((partner, i) => {
                  const retail = Math.round(partner * (1 + currentMarkup / 100) * 100) / 100;
                  const margin = Math.round((retail - partner) * 100) / 100;
                  return (
                    <div
                      key={partner}
                      className={
                        "flex items-center justify-between px-4 py-3 text-[12px] " +
                        (i % 2 === 0 ? "bg-[#F8FAFC]" : "bg-white")
                      }
                    >
                      <span className="font-extrabold tabular-nums text-[#0F172A]">
                        ₦{formatNgn(partner)}
                      </span>
                      <span className="font-extrabold tabular-nums text-[#1877F2]">
                        ₦{formatNgn(retail)}
                      </span>
                      <span className="font-extrabold tabular-nums text-emerald-600">
                        +₦{formatNgn(margin)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[#94A3B8]">
                All prices are in Naira. Your markup applies on top of the Naira
                price from Verxor, so if the base rate ever changes, both sides
                adjust automatically — your margin percentage is always preserved.
              </p>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
