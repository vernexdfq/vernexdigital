"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, X, CheckCircle2, Wifi, Loader2, Zap } from "lucide-react";

type NetworkId = "mtn" | "airtel" | "glo" | "9mobile";

const NETWORKS: { id: NetworkId; name: string; prefixes: string[] }[] = [
  { id: "mtn", name: "MTN", prefixes: ["0803","0806","0703","0706","0810","0813","0814","0816","0903","0906","0913","0916","0704"] },
  { id: "airtel", name: "Airtel", prefixes: ["0802","0808","0701","0708","0812","0901","0902","0904","0907","0912","0801"] },
  { id: "glo", name: "Glo", prefixes: ["0805","0807","0705","0811","0815","0905","0915"] },
  { id: "9mobile", name: "9mobile", prefixes: ["0809","0817","0818","0908","0909","0918"] },
];

function detectNetwork(phone: string): NetworkId | null {
  const clean = phone.replace(/\D/g, "");
  let local = clean;
  if (local.startsWith("234") && local.length >= 13) local = "0" + local.slice(3);
  if (local.length < 4) return null;
  const prefix = local.slice(0, 4);
  for (const net of NETWORKS) {
    if (net.prefixes.includes(prefix)) return net.id;
  }
  return null;
}

type Plan = {
  id: number;
  networkId: NetworkId;
  tab: string;
  data: string;
  validity: string;
  price: number; // face (retail) price the customer pays
  featured?: boolean;
};

const TABS = ["Hot", "Daily", "Weekly", "Monthly", "Yearly"];

function formatNaira(n: number) {
  return "\u20a6" + Math.round(n).toLocaleString("en-NG");
}

function validityLabel(days: string): string {
  const d = Number(days);
  if (d === 1) return "1 DAY";
  if (d === 14) return "14 DAYS";
  if (d === 30) return "30 DAYS";
  if (d === 60) return "2 MONTHS";
  if (d === 90) return "3 MONTHS";
  if (d === 365) return "1 YEAR";
  return `${d} DAYS`;
}

export default function DataPage() {
  const [phone, setPhone] = useState("");
  const [networkId, setNetworkId] = useState<NetworkId>("mtn");
  const [netOpen, setNetOpen] = useState(false);
  const [tab, setTab] = useState("Hot");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paying, setPaying] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [success, setSuccess] = useState<{ message: string; ref: string } | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/data/plans", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setLoadError(String(data.error || "Could not load data plans."));
        setPlans([]);
      } else {
        const mapped: Plan[] = (data.plans || []).map((p: Record<string, unknown>) => ({
          id: Number(p.id),
          networkId: String(p.network) as NetworkId,
          tab: String(p.tab || "monthly"),
          data: String(p.size || p.name || ""),
          validity: validityLabel(String(p.days || "30")),
          // face value the customer pays — the child price never leaks here
          price: Number(p.retail) > 0 ? Number(p.retail) : Number(p.price),
        }));
        setPlans(mapped);
      }
    } catch {
      setLoadError("Could not load data plans. Check your connection.");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPlans(); }, [loadPlans]);

  useEffect(() => {
    const detected = detectNetwork(phone);
    if (detected) setNetworkId(detected);
  }, [phone]);

  const activeNetwork = NETWORKS.find((n) => n.id === networkId) ?? NETWORKS[0];

  const filteredPlans = useMemo(() => {
    const netPlans = plans.filter((p) => p.networkId === networkId);
    if (tab === "Hot") {
      const hot = netPlans
        .filter((p) => p.tab === "daily" && p.price <= 1000)
        .slice(0, 9);
      if (hot.length === 0 && netPlans.length > 0) return netPlans.slice(0, 9);
      return hot;
    }
    if (tab === "Yearly") {
      return netPlans.filter((p) => p.tab === "threemonths" || p.tab === "yearly");
    }
    if (tab === "Monthly") {
      return netPlans.filter((p) => p.tab === "monthly" || p.tab === "router");
    }
    return netPlans.filter((p) => p.tab === tab.toLowerCase());
  }, [plans, networkId, tab]);

  async function confirmPurchase() {
    if (!selectedPlan) return;
    setPaying(true);
    setBuyError("");
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      const { data: sess } = await createClient(url, anon).auth.getSession();
      const jwt = sess.session?.access_token || "";
      const res = await fetch("/api/data/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          network: selectedPlan.networkId,
          planId: selectedPlan.id,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setBuyError(String(data.error || "Data purchase failed."));
        if (data.refunded) void loadPlans();
        return;
      }
      setSuccess({
        message: data.order?.message || "Data purchase successful",
        ref: data.order?.ref || "",
      });
      setSelectedPlan(null);
      setTimeout(() => setSuccess(null), 4500);
    } catch {
      setBuyError("Could not complete purchase. Check your connection and try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F5FB] pb-28">
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#1877F2] to-[#4A9DFF] shadow-md header-safe">
        <div className="h-14 px-4 flex items-center justify-between text-white">
          <Link href="/home" className="flex items-center gap-1.5 text-sm font-medium">
            <ArrowLeft size={18} /> Back
          </Link>
          <div className="flex flex-col items-center leading-tight">
            <h1 className="text-sm font-semibold">Buy Data</h1>
            <span className="text-[10px] text-white/80">Best rates, instant delivery</span>
          </div>
          <Link href="/history" className="text-sm font-medium">History</Link>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Network + phone */}
        <div className="rounded-[16px] bg-white border border-[#E2E8F0] shadow-sm p-4">
          <p className="text-[11px] font-bold tracking-wide text-[#64748B] uppercase">Select Network</p>
          <div className="mt-2 -mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full gap-2">
              {NETWORKS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNetworkId(n.id)}
                  className={`h-11 min-w-[92px] px-4 rounded-full text-sm font-bold shrink-0 transition-colors ${
                    networkId === n.id
                      ? "bg-gradient-to-r from-[#1877F2] to-[#4A9DFF] text-white shadow-md"
                      : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#334155]"
                  }`}
                >
                  {n.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">📱</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, "").slice(0, 14))}
              placeholder="Enter phone number"
              className="w-full h-12 pl-11 pr-10 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/20"
            />
            {phone && (
              <button type="button" onClick={() => { setPhone(""); setNetworkId("mtn"); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E2E8F0] flex items-center justify-center">
                <X size={12} className="text-[#64748B]" />
              </button>
            )}
          </div>
          {phone.length >= 4 && (
            <p className="mt-2 text-[11px] font-medium text-[#16A34A] flex items-center gap-1">
              <CheckCircle2 size={12} /> {activeNetwork.name} network detected
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="-mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`h-10 min-w-[80px] px-4 rounded-full text-xs font-bold shrink-0 transition-colors ${
                  tab === t
                    ? "bg-gradient-to-r from-[#1877F2] to-[#4A9DFF] text-white shadow-md"
                    : "bg-white border border-[#E2E8F0] text-[#64748B]"
                }`}
              >
                {t === "Hot" ? "🔥 Hot" : t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-[#64748B]">
            <Loader2 size={16} className="animate-spin" /> Loading data plans…
          </div>
        ) : loadError ? (
          <div className="rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] px-4 py-4 flex items-center justify-between gap-2">
            <p className="text-[12px] text-[#B91C1C]">{loadError}</p>
            <button type="button" onClick={() => void loadPlans()} className="text-[12px] font-bold text-[#1877F2] shrink-0">
              Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {filteredPlans.length === 0 ? (
              <p className="col-span-3 text-center text-sm text-[#94A3B8] py-10">No plans for this tab — try another</p>
            ) : (
              filteredPlans.map((p) => {
                const selected = selectedPlan?.id === p.id && selectedPlan?.networkId === p.networkId;
                return (
                  <button
                    key={`${p.networkId}-${p.id}`}
                    type="button"
                    onClick={() => { setSelectedPlan(p); setBuyError(""); }}
                    className={`min-w-0 rounded-[14px] bg-white p-3 flex flex-col gap-2 text-left transition-all border ${
                      selected
                        ? "border-[#1877F2] ring-2 ring-[#1877F2]/30 shadow-lg"
                        : "border-[#E2E8F0] shadow-sm active:scale-[0.97]"
                    }`}
                  >
                    <p className="text-[17px] leading-tight font-extrabold tracking-tight text-[#0F172A]">{p.data}</p>
                    <p className="text-[10px] leading-tight font-medium text-[#94A3B8] uppercase tracking-wide">{p.validity}</p>
                    <span className="inline-flex items-center gap-1 self-start rounded-full bg-gradient-to-r from-[#1877F2] to-[#4A9DFF] px-2.5 py-1 text-[11px] leading-none font-bold text-white tabular-nums">
                      <Zap size={10} /> {formatNaira(p.price)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        <div className="rounded-[14px] bg-gradient-to-r from-[#EFF6FF] to-[#F0F9FF] border border-[#BFDBFE] px-4 py-3 flex gap-2.5">
          <Wifi size={16} className="text-[#1877F2] shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#1E3A5F] leading-relaxed">
            MTN is selected by default. Enter a number to auto-detect the network. Data is delivered instantly after payment.
          </p>
        </div>
      </div>

      {/* Network sheet */}
      {netOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setNetOpen(false)} />
          <div className="relative bg-white rounded-t-[20px] max-h-[55vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-base font-semibold text-[#0F172A]">Select Network</h3>
              <button type="button" onClick={() => setNetOpen(false)} className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto px-2 pb-8">
              {NETWORKS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { setNetworkId(n.id); setNetOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-[12px] text-left ${networkId === n.id ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"}`}
                >
                  <span className={`text-sm font-medium ${networkId === n.id ? "text-[#1877F2]" : "text-[#0F172A]"}`}>{n.name}</span>
                  {networkId === n.id && <CheckCircle2 size={16} className="ml-auto text-[#1877F2]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm / checkout sheet */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => { if (!paying) setSelectedPlan(null); }} />
          <div className="relative bg-white rounded-t-[24px] shadow-2xl overflow-hidden">
            <div className="h-8 flex items-end justify-center">
              <span className="mb-2 h-1.5 w-10 rounded-full bg-[#E2E8F0]" />
            </div>
            <div className="px-5 pb-8">
              <div className="rounded-[16px] bg-gradient-to-r from-[#1877F2] to-[#4A9DFF] px-4 py-3.5 text-white flex items-center justify-between">
                <div>
                  <p className="text-lg font-extrabold leading-tight">{selectedPlan.data}</p>
                  <p className="text-[11px] text-white/85 mt-0.5">{activeNetwork.name} · {selectedPlan.validity}</p>
                </div>
                <p className="text-xl font-extrabold tabular-nums">{formatNaira(selectedPlan.price)}</p>
              </div>
              <div className="mt-4 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Network</span>
                  <span className="font-semibold text-[#0F172A]">{activeNetwork.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Bundle</span>
                  <span className="font-semibold text-[#0F172A]">{selectedPlan.data} · {selectedPlan.validity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Number</span>
                  <span className="font-semibold text-[#0F172A] tabular-nums">{phone || "—"}</span>
                </div>
              </div>
              {buyError && (
                <p className="mt-3 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] px-3 py-2 text-[12px] text-[#B91C1C]">{buyError}</p>
              )}
              <button
                type="button"
                disabled={paying}
                onClick={() => void confirmPurchase()}
                className="mt-5 w-full h-12 rounded-[12px] bg-gradient-to-r from-[#1877F2] to-[#4A9DFF] text-white text-sm font-bold shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {paying ? (<><Loader2 size={16} className="animate-spin" /> Processing…</>) : `Continue to Check Out · ${formatNaira(selectedPlan.price)}`}
              </button>
              <button type="button" disabled={paying} onClick={() => setSelectedPlan(null)} className="mt-2 w-full h-11 text-sm font-medium text-[#64748B]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {success && (
        <div className="fixed top-16 left-4 right-4 z-[80] flex justify-center">
          <div className="bg-[#0F172A] text-white text-sm font-medium px-4 py-3 rounded-[14px] shadow-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{success.message}{success.ref ? ` · Ref ${success.ref.slice(0, 12)}` : ""}</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        .header-safe { padding-top: env(safe-area-inset-top); }
      `}</style>
    </div>
  );
}
