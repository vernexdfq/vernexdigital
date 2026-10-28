"use client";

import { useEffect, useMemo, useState } from "react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import {
  Check,
  ChevronDown,
  Crown,
  Gauge,
  Info,
  Layers,
  Minus,
  Plus,
  Save,
  Zap,
} from "lucide-react";

/* ------------------------------------------------------------------
 * Virtual-number retail pricing (panel -> customer).
 * Each wholesale cost band maps to a tier; the markup multiplier the
 * admin sets here is what customers pay on the Virtual Number page.
 * ---------------------------------------------------------------- */

export const VN_PRICING_KEY = "vernexdigital_vn_pricing_v1";

export type VnTierId = "economy" | "standard" | "fast" | "premium";

export type VnTierPricing = {
  minNgn: number | null; // null = no floor
  maxNgn: number | null; // null = no ceiling
  markup: number; // customer pays ceil(wholesale * markup)
};

export type VnPricingConfig = {
  tiers: Record<VnTierId, VnTierPricing>;
};

export const VN_DEFAULT_PRICING: VnPricingConfig = {
  tiers: {
    economy: { minNgn: null, maxNgn: 1035, markup: 3.0 },
    standard: { minNgn: 1035, maxNgn: 1794, markup: 2.5 },
    fast: { minNgn: 1794, maxNgn: 3312, markup: 2.0 },
    premium: { minNgn: 3312, maxNgn: null, markup: 1.5 },
  },
};

export function loadVnPricing(): VnPricingConfig {
  if (typeof window === "undefined") return VN_DEFAULT_PRICING;
  try {
    const raw = window.localStorage.getItem(VN_PRICING_KEY);
    if (!raw) return VN_DEFAULT_PRICING;
    const parsed = JSON.parse(raw) as Partial<VnPricingConfig>;
    const tiers = parsed?.tiers;
    if (!tiers) return VN_DEFAULT_PRICING;
    const merged: Record<VnTierId, VnTierPricing> = {
      economy: { ...VN_DEFAULT_PRICING.tiers.economy, ...tiers.economy },
      standard: { ...VN_DEFAULT_PRICING.tiers.standard, ...tiers.standard },
      fast: { ...VN_DEFAULT_PRICING.tiers.fast, ...tiers.fast },
      premium: { ...VN_DEFAULT_PRICING.tiers.premium, ...tiers.premium },
    };
    return { tiers: merged };
  } catch {
    return VN_DEFAULT_PRICING;
  }
}

function saveVnPricing(config: VnPricingConfig) {
  window.localStorage.setItem(VN_PRICING_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent("vernex-vn-pricing-updated"));
}

function naira(n: number) {
  return "₦" + Math.round(n).toLocaleString("en-NG") + ".00";
}

type TierDraft = { min: string; max: string; markup: string };

type TierMeta = {
  id: VnTierId;
  label: string;
  blurb: string;
  icon: React.ReactNode;
  tile: string;
  accent: string;
  chipBg: string;
  chipText: string;
  hasMin: boolean;
  hasMax: boolean;
};

const TIERS: TierMeta[] = [
  {
    id: "economy",
    label: "Economy",
    blurb: "Cheapest pools — best for low-cost verifications",
    icon: <Gauge size={18} strokeWidth={2.3} />,
    tile: "bg-emerald-50 text-emerald-600",
    accent: "text-emerald-600",
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-600",
    hasMin: false,
    hasMax: true,
  },
  {
    id: "standard",
    label: "Standard",
    blurb: "Balanced price and success rate",
    icon: <Layers size={18} strokeWidth={2.3} />,
    tile: "bg-blue-50 text-[#1877F2]",
    accent: "text-[#1877F2]",
    chipBg: "bg-blue-50",
    chipText: "text-[#1877F2]",
    hasMin: true,
    hasMax: true,
  },
  {
    id: "fast",
    label: "Fast",
    blurb: "Quick OTP delivery on popular services",
    icon: <Zap size={18} strokeWidth={2.3} />,
    tile: "bg-violet-50 text-violet-600",
    accent: "text-violet-600",
    chipBg: "bg-violet-50",
    chipText: "text-violet-600",
    hasMin: true,
    hasMax: true,
  },
  {
    id: "premium",
    label: "Premium",
    blurb: "Highest success rate — all countries and services",
    icon: <Crown size={18} strokeWidth={2.3} />,
    tile: "bg-amber-50 text-amber-600",
    accent: "text-amber-600",
    chipBg: "bg-amber-50",
    chipText: "text-amber-600",
    hasMin: true,
    hasMax: false,
  },
];

function draftsFromConfig(config: VnPricingConfig): Record<VnTierId, TierDraft> {
  const t = config.tiers;
  return {
    economy: { min: "", max: t.economy.maxNgn != null ? String(t.economy.maxNgn) : "", markup: String(t.economy.markup) },
    standard: { min: t.standard.minNgn != null ? String(t.standard.minNgn) : "", max: t.standard.maxNgn != null ? String(t.standard.maxNgn) : "", markup: String(t.standard.markup) },
    fast: { min: t.fast.minNgn != null ? String(t.fast.minNgn) : "", max: t.fast.maxNgn != null ? String(t.fast.maxNgn) : "", markup: String(t.fast.markup) },
    premium: { min: t.premium.minNgn != null ? String(t.premium.minNgn) : "", max: "", markup: String(t.premium.markup) },
  };
}

export default function VnPricingAdminPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<VnTierId, TierDraft>>(() => draftsFromConfig(loadVnPricing()));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function setDraft(id: VnTierId, field: keyof TierDraft, value: string) {
    const clean = field === "markup" ? value.replace(/[^0-9.]/g, "").slice(0, 5) : value.replace(/[^0-9]/g, "");
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], [field]: clean } }));
  }

  function nudgeMarkup(id: VnTierId, delta: number) {
    setDrafts((prev) => {
      const current = Number(prev[id].markup);
      const next = Math.min(10, Math.max(1.05, Math.round(((Number.isFinite(current) ? current : 2) + delta) * 100) / 100));
      return { ...prev, [id]: { ...prev[id], markup: String(next) } };
    });
  }

  const markupPct = (markup: string) => {
    const m = Number(markup);
    if (!Number.isFinite(m) || m <= 1) return "--";
    return "+" + Math.round((m - 1) * 100) + "%";
  };

  const apiPriceLabel = (meta: TierMeta) => {
    const d = drafts[meta.id];
    const markup = Number(d.markup);
    if (!Number.isFinite(markup) || markup <= 0) return "--";
    if (meta.hasMax) {
      const max = Number(d.max);
      if (!Number.isFinite(max) || max <= 0) return "--";
      return "< " + naira(max * markup);
    }
    const min = Number(d.min);
    if (!Number.isFinite(min) || min <= 0) return "--";
    return "> " + naira(min * markup);
  };

  const bandLabel = (meta: TierMeta) => {
    const d = drafts[meta.id];
    if (meta.hasMin && meta.hasMax) {
      return naira(Number(d.min) || 0) + " – " + naira(Number(d.max) || 0);
    }
    if (meta.hasMax) return "< " + naira(Number(d.max) || 0);
    return "> " + naira(Number(d.min) || 0);
  };

  const sampleLabel = (meta: TierMeta) => {
    const d = drafts[meta.id];
    const markup = Number(d.markup);
    if (!Number.isFinite(markup) || markup <= 0) return null;
    const base = meta.hasMax && Number(d.max) > 0 ? Math.round(Number(d.max) * 0.8) : Number(d.min) > 0 ? Number(d.min) * 2 : 0;
    if (!base) return null;
    return "Base " + naira(base) + " → customer pays " + naira(base * markup);
  };

  const valid = useMemo(() => {
    return TIERS.every((meta) => {
      const d = drafts[meta.id];
      const markup = Number(d.markup);
      if (!Number.isFinite(markup) || markup < 1.05 || markup > 10) return false;
      if (meta.hasMax && !(Number(d.max) > 0)) return false;
      if (meta.hasMin && !(Number(d.min) > 0)) return false;
      if (meta.hasMin && meta.hasMax && Number(d.min) >= Number(d.max)) return false;
      return true;
    });
  }, [drafts]);

  function save() {
    if (!valid || saving) return;
    setSaving(true);
    try {
      const config: VnPricingConfig = {
        tiers: {
          economy: { minNgn: null, maxNgn: Number(drafts.economy.max), markup: Number(drafts.economy.markup) },
          standard: { minNgn: Number(drafts.standard.min), maxNgn: Number(drafts.standard.max), markup: Number(drafts.standard.markup) },
          fast: { minNgn: Number(drafts.fast.min), maxNgn: Number(drafts.fast.max), markup: Number(drafts.fast.markup) },
          premium: { minNgn: Number(drafts.premium.min), maxNgn: null, markup: Number(drafts.premium.markup) },
        },
      };
      saveVnPricing(config);
      setToast("Pricing saved — customer prices updated");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-16">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-2.5 px-4">
          <AdminMenuButton onClick={() => setMenuOpen(true)} />
          <div className="min-w-0">
            <h1 className="text-[16px] font-extrabold tracking-tight text-[#0F172A]">Virtual Numbers</h1>
            <p className="text-[11px] font-semibold text-[#64748B] truncate">Set the prices your customers pay</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-bold text-[#1877F2] tabular-nums">
            4 tiers
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {TIERS.map((meta) => {
          const d = drafts[meta.id];
          const sample = sampleLabel(meta);
          return (
            <section key={meta.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + meta.tile}>
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-bold text-slate-900">{meta.label}</h2>
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + meta.chipBg + " " + meta.chipText}>
                      Markup {markupPct(d.markup)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{meta.blurb}</p>
                </div>
              </div>

              {/* base cost band — full width, bold */}
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Base cost (wholesale)</p>
                <div className="mt-1.5 flex items-center gap-2">
                  {meta.hasMin ? (
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-extrabold text-slate-400">₦</span>
                      <input
                        value={d.min}
                        inputMode="numeric"
                        onChange={(e) => setDraft(meta.id, "min", e.target.value)}
                        aria-label={meta.label + " base cost minimum"}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2 text-[15px] font-bold tabular-nums text-slate-900 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  ) : null}
                  {meta.hasMin && meta.hasMax ? (
                    <span className="text-[13px] font-bold text-slate-300">to</span>
                  ) : null}
                  {meta.hasMax ? (
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-extrabold text-slate-400">₦</span>
                      <input
                        value={d.max}
                        inputMode="numeric"
                        onChange={(e) => setDraft(meta.id, "max", e.target.value)}
                        aria-label={meta.label + " base cost maximum"}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2 text-[15px] font-bold tabular-nums text-slate-900 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  ) : null}
                  {meta.hasMin && !meta.hasMax ? (
                    <span className="text-[13px] font-bold text-slate-500">and above</span>
                  ) : null}
                  {!meta.hasMin && meta.hasMax ? (
                    <span className="text-[13px] font-bold text-slate-500">and below</span>
                  ) : null}
                </div>
              </div>

              {/* markup — the star of the card: big bold input with +/- steppers */}
              <div className="mt-3.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Your markup</p>
                <div className="mt-1.5 flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => nudgeMarkup(meta.id, -0.05)}
                    aria-label={"Decrease " + meta.label + " markup"}
                    className="flex h-12 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 active:scale-95"
                  >
                    <Minus size={16} strokeWidth={2.6} />
                  </button>
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[16px] font-extrabold text-slate-400">×</span>
                    <input
                      value={d.markup}
                      inputMode="decimal"
                      onChange={(e) => setDraft(meta.id, "markup", e.target.value)}
                      aria-label={meta.label + " markup multiplier"}
                      className="h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-8 pr-9 text-center text-[18px] font-extrabold tabular-nums text-slate-900 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                  <button
                    type="button"
                    onClick={() => nudgeMarkup(meta.id, 0.05)}
                    aria-label={"Increase " + meta.label + " markup"}
                    className="flex h-12 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 active:scale-95"
                  >
                    <Plus size={16} strokeWidth={2.6} />
                  </button>
                </div>
              </div>

              {/* API price — big, bold, accent color */}
              <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">API price (customer pays)</p>
                  <span className={"text-[10px] font-bold " + meta.accent}>{markupPct(d.markup)} markup</span>
                </div>
                <p className={"mt-0.5 text-[20px] font-extrabold tabular-nums " + meta.accent}>{apiPriceLabel(meta)}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-400">{bandLabel(meta)} base</p>
                  {sample && <p className="text-[11px] font-medium text-slate-400">{sample}</p>}
                </div>
              </div>
            </section>
          );
        })}

        <button
          type="button"
          onClick={save}
          disabled={!valid || saving}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1877F2] text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.3)] transition active:scale-[0.99] disabled:opacity-50"
        >
          <Save size={18} strokeWidth={2.6} />
          {saving ? "Saving…" : "Save Changes"}
        </button>
        {!valid && (
          <p className="-mt-2 text-center text-[11px] font-medium text-slate-400">
            Enter a valid markup (1.05–10) and cost bands for every tier to save.
          </p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <Info size={15} className="text-slate-400" />
            <h3 className="text-[13px] font-bold text-slate-900">Important notes</h3>
          </div>
          <ul className="mt-2.5 space-y-2">
            <li className="flex gap-2 text-[12px] leading-relaxed text-slate-500">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              Wholesale cost is what a number costs you from the provider pool. Your markup is applied on top of it.
            </li>
            <li className="flex gap-2 text-[12px] leading-relaxed text-slate-500">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              Customers see the final price on the Virtual Number page instantly after you save.
            </li>
            <li className="flex gap-2 text-[12px] leading-relaxed text-slate-500">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              Keep bands non-overlapping — a number is matched to a tier from Economy up to Premium.
            </li>
            <li className="flex gap-2 text-[12px] leading-relaxed text-slate-500">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              Markup is a multiplier: 3.0 means the customer pays triple your wholesale cost.
            </li>
          </ul>
        </section>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg" role="status">
          <Check size={15} className="text-emerald-400" strokeWidth={2.6} />
          {toast}
        </div>
      )}
    </div>
  );
}
