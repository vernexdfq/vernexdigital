"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Check } from "lucide-react";

type ServiceKey = "numbers" | "rent" | "smm" | "accounts";

type ServiceRow = {
  key: ServiceKey;
  label: string;
  enabled: boolean;
  wholesale: number;
  retail: number;
  mode: "percent" | "fixed";
  markupPct: number;
};

const INITIAL: ServiceRow[] = [
  {
    key: "numbers",
    label: "Virtual Numbers",
    enabled: true,
    wholesale: 450,
    retail: 650,
    mode: "percent",
    markupPct: 30,
  },
  {
    key: "rent",
    label: "Rent a Line",
    enabled: true,
    wholesale: 1200,
    retail: 1800,
    mode: "fixed",
    markupPct: 0,
  },
  {
    key: "smm",
    label: "SMM Boost",
    enabled: true,
    wholesale: 2000,
    retail: 2800,
    mode: "percent",
    markupPct: 25,
  },
  {
    key: "accounts",
    label: "Buy Accounts",
    enabled: false,
    wholesale: 3500,
    retail: 5000,
    mode: "fixed",
    markupPct: 0,
  },
];

function naira(n: number) {
  return `₦${n.toLocaleString()}`;
}

export default function AdminWalletPage() {
  const [panelBalance] = useState(84250);
  const [globalMarkup, setGlobalMarkup] = useState(25);
  const [rows, setRows] = useState(INITIAL);
  const [saved, setSaved] = useState(false);

  function updateRow(key: ServiceKey, patch: Partial<ServiceRow>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (patch.mode === "percent" || (patch.markupPct !== undefined && next.mode === "percent")) {
          next.retail = Math.round(next.wholesale * (1 + next.markupPct / 100));
        }
        if (next.retail < next.wholesale) next.retail = next.wholesale;
        return next;
      })
    );
    setSaved(false);
  }

  function applyGlobal() {
    setRows((prev) =>
      prev.map((r) => {
        if (!r.enabled) return r;
        const retail = Math.round(r.wholesale * (1 + globalMarkup / 100));
        return { ...r, mode: "percent" as const, markupPct: globalMarkup, retail };
      })
    );
    setSaved(false);
  }

  function save() {
    setSaved(true);
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-20">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-[#64748B]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Wallet & Pricing</h1>
      </header>

      <div className="px-4 pt-4 max-w-lg mx-auto space-y-5">
        {/* Panel wallet with Verxor */}
        <section className="bg-gradient-to-br from-[#0B1F4D] to-[#1877F2] rounded-[16px] p-5 text-white">
          <p className="text-[11px] font-semibold tracking-wide text-white/70 uppercase">
            Your panel wallet (Verxor wholesale)
          </p>
          <p className="text-3xl font-bold mt-1">{naira(panelBalance)}</p>
          <p className="text-xs text-white/75 mt-2 leading-relaxed">
            Used to fulfill customer orders at wholesale. Top up when low so sales keep flowing.
          </p>
          {panelBalance < 20000 && (
            <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-amber-400/20 border border-amber-300/30 px-3 py-2">
              <AlertTriangle size={16} className="text-amber-200 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-50">Low balance warning — fund soon to avoid failed orders.</p>
            </div>
          )}
          <button
            type="button"
            className="mt-4 h-10 px-4 rounded-full bg-white text-[#0F172A] text-sm font-semibold"
          >
            Fund wholesale wallet
          </button>
        </section>

        {/* Global markup */}
        <section className="bg-white border border-[#E2E8F0] rounded-[14px] p-4">
          <p className="text-sm font-semibold text-[#0F172A]">Default global markup</p>
          <p className="text-xs text-[#64748B] mt-0.5">
            Apply a percentage on top of wholesale for enabled services. Floor = wholesale (no loss-leader by default).
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              value={globalMarkup}
              onChange={(e) => setGlobalMarkup(Number(e.target.value) || 0)}
              className="w-24 h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
            />
            <span className="text-sm text-[#64748B]">%</span>
            <button
              type="button"
              onClick={applyGlobal}
              className="ml-auto h-11 px-4 rounded-full bg-[#EFF6FF] text-[#1877F2] text-sm font-semibold"
            >
              Apply to all
            </button>
          </div>
        </section>

        {/* Per service */}
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase mb-2">
            Service retail pricing
          </p>
          <div className="space-y-3">
            {rows.map((r) => {
              const margin = r.retail - r.wholesale;
              const marginPct = r.wholesale ? Math.round((margin / r.wholesale) * 100) : 0;
              return (
                <div key={r.key} className="bg-white border border-[#E2E8F0] rounded-[14px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#0F172A]">{r.label}</p>
                    <button
                      type="button"
                      onClick={() => updateRow(r.key, { enabled: !r.enabled })}
                      className={`h-7 px-2.5 rounded-full text-[11px] font-semibold border ${
                        r.enabled
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0]"
                      }`}
                    >
                      {r.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#F8FAFC] rounded-[10px] py-2 px-1">
                      <p className="text-[10px] text-[#94A3B8]">Your cost</p>
                      <p className="text-xs font-semibold text-[#0F172A] mt-0.5">{naira(r.wholesale)}</p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-[10px] py-2 px-1">
                      <p className="text-[10px] text-[#94A3B8]">Retail</p>
                      <p className="text-xs font-semibold text-[#1877F2] mt-0.5">{naira(r.retail)}</p>
                    </div>
                    <div className="bg-[#F8FAFC] rounded-[10px] py-2 px-1">
                      <p className="text-[10px] text-[#94A3B8]">Margin</p>
                      <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                        {naira(margin)} · {marginPct}%
                      </p>
                    </div>
                  </div>

                  {r.enabled && (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateRow(r.key, { mode: "percent" })}
                          className={`flex-1 h-9 rounded-full text-xs font-semibold border ${
                            r.mode === "percent"
                              ? "bg-[#1877F2] text-white border-[#1877F2]"
                              : "bg-white text-[#64748B] border-[#E2E8F0]"
                          }`}
                        >
                          % Markup
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRow(r.key, { mode: "fixed" })}
                          className={`flex-1 h-9 rounded-full text-xs font-semibold border ${
                            r.mode === "fixed"
                              ? "bg-[#1877F2] text-white border-[#1877F2]"
                              : "bg-white text-[#64748B] border-[#E2E8F0]"
                          }`}
                        >
                          Fixed retail
                        </button>
                      </div>
                      {r.mode === "percent" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={r.markupPct}
                            onChange={(e) =>
                              updateRow(r.key, { markupPct: Number(e.target.value) || 0 })
                            }
                            className="w-full h-10 px-3 rounded-[10px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
                          />
                          <span className="text-xs text-[#64748B] shrink-0">% over cost</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#64748B]">₦</span>
                          <input
                            type="number"
                            value={r.retail}
                            onChange={(e) =>
                              updateRow(r.key, {
                                retail: Math.max(r.wholesale, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full h-10 px-3 rounded-[10px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-[#94A3B8] leading-relaxed">
          Currency for customers: NGN. Child Panel billing is separate from API key pricing.
        </p>

        <button
          type="button"
          onClick={save}
          className="w-full h-12 rounded-full bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2"
        >
          {saved ? (
            <>
              <Check size={18} /> Saved
            </>
          ) : (
            "Save pricing"
          )}
        </button>
      </div>
    </div>
  );
}
