"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, X, CheckCircle2, Wifi } from "lucide-react";

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

type Plan = { id: string; networkId: NetworkId; tab: string; data: string; validity: string; price: number; originalPrice?: number; featured?: boolean };

const PLANS: Plan[] = [
  { id: "mtn-3.2gb", networkId: "mtn", tab: "Best Offers", data: "3.2GB", validity: "2 DAYS", price: 905, originalPrice: 1000, featured: true },
  { id: "mtn-110mb", networkId: "mtn", tab: "Best Offers", data: "110MB", validity: "1 DAY", price: 50, originalPrice: 100 },
  { id: "mtn-1gb", networkId: "mtn", tab: "Best Offers", data: "1GB", validity: "1 DAY", price: 405, originalPrice: 500 },
  { id: "mtn-2gb", networkId: "mtn", tab: "Best Offers", data: "2GB", validity: "2 DAYS", price: 655, originalPrice: 750 },
  { id: "mtn-3.5gb", networkId: "mtn", tab: "Best Offers", data: "3.5GB", validity: "7 DAYS", price: 1405, originalPrice: 1500 },
  { id: "mtn-11gb", networkId: "mtn", tab: "Best Offers", data: "11GB", validity: "7 DAYS", price: 3405, originalPrice: 3500, featured: true },
  { id: "mtn-d-1gb", networkId: "mtn", tab: "Daily", data: "1GB", validity: "1 DAY", price: 405, originalPrice: 500 },
  { id: "mtn-w-2gb", networkId: "mtn", tab: "Weekly", data: "2GB", validity: "7 DAYS", price: 905, originalPrice: 1000 },
  { id: "mtn-m-2gb", networkId: "mtn", tab: "Monthly", data: "2GB", validity: "30 DAYS", price: 1405, originalPrice: 1500 },
  { id: "air-3gb", networkId: "airtel", tab: "Best Offers", data: "3GB", validity: "2 DAYS", price: 655, originalPrice: 750, featured: true },
  { id: "glo-2gb", networkId: "glo", tab: "Best Offers", data: "2GB", validity: "2 DAYS", price: 480, originalPrice: 550 },
];

const TABS = ["Best Offers", "Daily", "Weekly", "Monthly"];

function formatNaira(n: number) {
  return "\u20a6" + n.toLocaleString("en-NG");
}

export default function DataPage() {
  const [phone, setPhone] = useState("");
  const [networkId, setNetworkId] = useState<NetworkId>("mtn");
  const [netOpen, setNetOpen] = useState(false);
  const [tab, setTab] = useState("Best Offers");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const detected = detectNetwork(phone);
    if (detected) setNetworkId(detected);
  }, [phone]);

  const activeNetwork = NETWORKS.find((n) => n.id === networkId) ?? NETWORKS[0];
  const filteredPlans = useMemo(
    () => PLANS.filter((p) => p.networkId === networkId && p.tab === tab),
    [networkId, tab]
  );
  const featuredPlan = useMemo(
    () => PLANS.find((p) => p.networkId === networkId && p.featured) || PLANS.find((p) => p.networkId === networkId && p.tab === "Best Offers"),
    [networkId]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]">
            <ArrowLeft size={18} /> Back
          </Link>
          <h1 className="text-sm font-semibold text-[#0F172A]">Data</h1>
          <Link href="/history" className="text-sm font-medium text-[#1877F2]">History</Link>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-3.5">
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => setNetOpen(true)} className="flex items-center gap-1.5 h-11 px-2.5 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] shrink-0">
              <span className="text-xs font-semibold text-[#0F172A]">{activeNetwork.name}</span>
              <ChevronDown size={14} className="text-[#94A3B8]" />
            </button>
            <div className="flex-1 relative">
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, "").slice(0, 14))}
                placeholder="e.g. 0803 000 0000"
                className="w-full h-11 px-3 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2]"
              />
              {phone && (
                <button type="button" onClick={() => { setPhone(""); setNetworkId("mtn"); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E2E8F0] flex items-center justify-center">
                  <X size={12} className="text-[#64748B]" />
                </button>
              )}
            </div>
          </div>
          {phone.length >= 4 && (
            <p className="mt-2 text-[11px] text-[#16A34A] flex items-center gap-1">
              <CheckCircle2 size={12} /> Detected {activeNetwork.name} network
            </p>
          )}
        </div>

        {featuredPlan && (
          <button
            type="button"
            onClick={() => { setSelectedPlan(featuredPlan); setBuying(true); }}
            className="w-full rounded-[14px] bg-gradient-to-r from-[#1877F2] to-[#0B5ED7] p-4 text-left text-white shadow-md"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">Best Offer</p>
            <p className="mt-1 text-lg font-bold">{featuredPlan.data} · {featuredPlan.validity}</p>
            <p className="mt-1 text-sm">{formatNaira(featuredPlan.price)}</p>
          </button>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`h-8 px-3 rounded-full text-[11px] font-semibold shrink-0 ${tab === t ? "bg-[#1877F2] text-white" : "bg-white border border-[#E2E8F0] text-[#64748B]"}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {filteredPlans.length === 0 ? (
            <p className="text-center text-sm text-[#94A3B8] py-10">No plans for this tab</p>
          ) : (
            filteredPlans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setSelectedPlan(p); setBuying(true); }}
                className="w-full bg-white rounded-[12px] border border-[#E2E8F0] p-3.5 flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{p.data}</p>
                  <p className="text-[11px] text-[#94A3B8]">{p.validity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#1877F2] tabular-nums">{formatNaira(p.price)}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="rounded-[12px] bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-3 flex gap-2.5">
          <Wifi size={16} className="text-[#1877F2] shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#1E3A5F] leading-relaxed">
            MTN is selected by default. Enter a number to auto-detect network. Data is delivered instantly after payment.
          </p>
        </div>
      </div>

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

      {buying && selectedPlan && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setBuying(false)} />
          <div className="relative bg-white rounded-t-[20px] shadow-xl px-4 pt-5 pb-8">
            <h3 className="text-base font-semibold text-[#0F172A] text-center">Confirm Data</h3>
            <div className="mt-4 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Network</span>
                <span className="font-medium text-[#0F172A]">{activeNetwork.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Plan</span>
                <span className="font-medium text-[#0F172A]">{selectedPlan.data} · {selectedPlan.validity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Number</span>
                <span className="font-medium text-[#0F172A] tabular-nums">{phone || "—"}</span>
              </div>
              <div className="border-t border-[#E2E8F0] pt-3 flex justify-between">
                <span className="text-sm font-medium text-[#0F172A]">Amount</span>
                <span className="text-lg font-bold text-[#1877F2] tabular-nums">{formatNaira(selectedPlan.price)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setBuying(false);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 2800);
                setSelectedPlan(null);
              }}
              className="mt-5 w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold"
            >
              Pay {formatNaira(selectedPlan.price)}
            </button>
            <button type="button" onClick={() => setBuying(false)} className="mt-2 w-full h-11 text-sm font-medium text-[#64748B]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-16 left-4 right-4 z-[80] flex justify-center">
          <div className="bg-[#0F172A] text-white text-sm font-medium px-4 py-3 rounded-[12px] shadow-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Data purchase submitted (demo)
          </div>
        </div>
      )}
    </div>
  );
}
