"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wifi,
  ChevronDown,
  X,
  RefreshCw,
  Zap,
  CheckCircle2,
} from "lucide-react";

/* ── Network config (Nigerian prefixes) ─────────────────────────── */
type NetworkId = "mtn" | "airtel" | "glo" | "9mobile" | "smile";

const NETWORKS: {
  id: NetworkId;
  name: string;
  color: string;
  bg: string;
  prefixes: string[];
}[] = [
  {
    id: "mtn",
    name: "MTN",
    color: "#FFCC00",
    bg: "#FFF8E1",
    prefixes: [
      "0803", "0806", "0703", "0706", "0810", "0813", "0814", "0816",
      "0903", "0906", "0913", "0916", "0702", "0704",
    ],
  },
  {
    id: "airtel",
    name: "Airtel",
    color: "#ED1C24",
    bg: "#FFEBEE",
    prefixes: [
      "0802", "0808", "0701", "0708", "0812", "0901", "0902", "0904",
      "0907", "0912", "0801",
    ],
  },
  {
    id: "glo",
    name: "Glo",
    color: "#00A651",
    bg: "#E8F5E9",
    prefixes: ["0805", "0807", "0705", "0811", "0815", "0905", "0915"],
  },
  {
    id: "9mobile",
    name: "9mobile",
    color: "#006F3C",
    bg: "#E0F2F1",
    prefixes: ["0809", "0817", "0818", "0908", "0909", "0918"],
  },
  {
    id: "smile",
    name: "Smile",
    color: "#8BC34A",
    bg: "#F1F8E9",
    prefixes: ["0702"],
  },
];

function detectNetwork(phone: string): NetworkId | null {
  const clean = phone.replace(/\D/g, "");
  let local = clean;
  if (local.startsWith("234") && local.length >= 13) {
    local = "0" + local.slice(3);
  }
  if (local.length < 4) return null;
  const prefix = local.slice(0, 4);
  for (const net of NETWORKS) {
    if (net.prefixes.includes(prefix)) return net.id;
  }
  return null;
}

/* ── Demo plan catalog (swap with provider API) ─────────────────── */
type Plan = {
  id: string;
  networkId: NetworkId;
  tab: string;
  data: string;
  validity: string;
  price: number;
  originalPrice?: number;
  cashback?: number;
  badge?: string;
  extra?: string;
  featured?: boolean;
};

const PLANS: Plan[] = [
  { id: "mtn-3.2gb", networkId: "mtn", tab: "Best Offers", data: "3.2GB", validity: "2 DAYS", price: 905, originalPrice: 1000, cashback: 10, featured: true },
  { id: "mtn-110mb", networkId: "mtn", tab: "Best Offers", data: "110MB", validity: "1 DAY", price: 50, originalPrice: 100, cashback: 1 },
  { id: "mtn-1gb", networkId: "mtn", tab: "Best Offers", data: "1GB", validity: "1 DAY", price: 405, originalPrice: 500, cashback: 5, extra: "+ 1.5mins" },
  { id: "mtn-2gb", networkId: "mtn", tab: "Best Offers", data: "2GB", validity: "2 DAYS", price: 655, originalPrice: 750, cashback: 8 },
  { id: "mtn-3.5gb", networkId: "mtn", tab: "Best Offers", data: "3.5GB", validity: "7 DAYS", price: 1405, originalPrice: 1500, cashback: 15 },
  { id: "mtn-11gb", networkId: "mtn", tab: "Best Offers", data: "11GB", validity: "7 DAYS", price: 3405, originalPrice: 3500, cashback: 30, featured: true },

  { id: "mtn-d-2.5gb", networkId: "mtn", tab: "Daily", data: "2.5GB", validity: "1 DAY", price: 655, originalPrice: 750, cashback: 8 },
  { id: "mtn-d-20mb", networkId: "mtn", tab: "Daily", data: "20MB", validity: "1 DAY", price: 13, originalPrice: 25, cashback: 0, extra: "Facebook" },
  { id: "mtn-d-110mb", networkId: "mtn", tab: "Daily", data: "110MB", validity: "1 DAY", price: 50, originalPrice: 100, cashback: 1 },
  { id: "mtn-d-230mb", networkId: "mtn", tab: "Daily", data: "230MB", validity: "1 DAY", price: 105, originalPrice: 200 },
  { id: "mtn-d-500mb", networkId: "mtn", tab: "Daily", data: "500MB", validity: "1 DAY", price: 255, originalPrice: 350, cashback: 4 },
  { id: "mtn-d-1gb", networkId: "mtn", tab: "Daily", data: "1GB", validity: "1 DAY", price: 405, originalPrice: 500, cashback: 5, extra: "+ 1.5mins" },

  { id: "mtn-w-2gb", networkId: "mtn", tab: "Weekly", data: "2GB", validity: "7 DAYS", price: 905, originalPrice: 1000, cashback: 10 },
  { id: "mtn-w-3.5gb", networkId: "mtn", tab: "Weekly", data: "3.5GB", validity: "7 DAYS", price: 1405, originalPrice: 1500, cashback: 15 },
  { id: "mtn-w-11gb", networkId: "mtn", tab: "Weekly", data: "11GB", validity: "7 DAYS", price: 3405, originalPrice: 3500, cashback: 30 },

  { id: "mtn-m-2gb", networkId: "mtn", tab: "Monthly", data: "2GB", validity: "30 DAYS", price: 1405, originalPrice: 1500, cashback: 15, extra: "+ 2mins" },
  { id: "mtn-m-2.7gb", networkId: "mtn", tab: "Monthly", data: "2.7GB", validity: "30 DAYS", price: 1905, originalPrice: 2000, cashback: 20, extra: "+ 2mins" },
  { id: "mtn-m-3.5gb", networkId: "mtn", tab: "Monthly", data: "3.5GB", validity: "30 DAYS", price: 2405, originalPrice: 2500, cashback: 25, extra: "+ 5mins" },
  { id: "mtn-m-7gb", networkId: "mtn", tab: "Monthly", data: "7GB", validity: "30 DAYS", price: 3405, originalPrice: 3500, cashback: 30, extra: "+ Youtube" },
  { id: "mtn-m-10gb", networkId: "mtn", tab: "Monthly", data: "10GB", validity: "30 DAYS", price: 4405, originalPrice: 4500, cashback: 30, extra: "+ 10mins" },
  { id: "mtn-m-12.5gb", networkId: "mtn", tab: "Monthly", data: "12.5GB", validity: "30 DAYS", price: 5405, originalPrice: 5500, cashback: 30, extra: "+ Youtube" },

  { id: "mtn-s-20mb", networkId: "mtn", tab: "Social", data: "20MB", validity: "1 DAY", price: 13, originalPrice: 25, extra: "Facebook" },
  { id: "mtn-s-40mb", networkId: "mtn", tab: "Social", data: "40MB", validity: "7 DAYS", price: 25, originalPrice: 50, cashback: 1, extra: "WhatsApp" },
  { id: "mtn-s-2gb", networkId: "mtn", tab: "Social", data: "2GB", validity: "7 DAYS", price: 305, originalPrice: 400, cashback: 4, extra: "TikTok" },

  { id: "mtn-b-60gb", networkId: "mtn", tab: "Broadband", data: "60GB", validity: "30 DAYS", price: 14405, originalPrice: 14500, cashback: 30, badge: "Broadband" },
  { id: "mtn-b-150gb", networkId: "mtn", tab: "Broadband", data: "150GB", validity: "30 DAYS", price: 29905, originalPrice: 30000, cashback: 30, badge: "Broadband" },
  { id: "mtn-b-200gb", networkId: "mtn", tab: "Broadband", data: "200GB", validity: "30 DAYS", price: 37405, originalPrice: 37500, cashback: 30, badge: "Broadband" },
  { id: "mtn-b-1.5tb", networkId: "mtn", tab: "Broadband", data: "1.5TB", validity: "365 DAYS", price: 224905, originalPrice: 225000, cashback: 30, badge: "Broadband" },
  { id: "mtn-b-260gb", networkId: "mtn", tab: "Broadband", data: "260GB", validity: "30 DAYS", price: 44905, originalPrice: 45000, badge: "Broadband" },

  { id: "mtn-x-600mb", networkId: "mtn", tab: "XtraValue", data: "600MB", validity: "7 DAYS", price: 405, originalPrice: 500, cashback: 5, badge: "XtraValue" },
  { id: "mtn-x-1.8gb", networkId: "mtn", tab: "XtraValue", data: "1.8GB", validity: "30 DAYS", price: 1405, originalPrice: 1500, cashback: 15, badge: "XtraValue" },
  { id: "mtn-x-5.5gb", networkId: "mtn", tab: "XtraValue", data: "5.5GB", validity: "30 DAYS", price: 2905, originalPrice: 3000, badge: "XtraValue" },

  { id: "air-10gb", networkId: "airtel", tab: "Best Offers", data: "10GB", validity: "7 DAYS", price: 2905, originalPrice: 3000, cashback: 30, featured: true },
  { id: "air-3gb", networkId: "airtel", tab: "Best Offers", data: "3GB", validity: "2 DAYS", price: 655, originalPrice: 750, cashback: 8, extra: "+ Youtube" },
  { id: "air-1gb", networkId: "airtel", tab: "Best Offers", data: "1GB", validity: "1 DAY", price: 405, originalPrice: 500, cashback: 5 },
  { id: "air-2gb", networkId: "airtel", tab: "Best Offers", data: "2GB", validity: "2 DAYS", price: 505, originalPrice: 600, cashback: 6, extra: "+ Youtube" },
  { id: "air-4gb", networkId: "airtel", tab: "Best Offers", data: "4GB", validity: "2 DAYS", price: 905, originalPrice: 1000, cashback: 10, extra: "+ Youtube" },
  { id: "air-6gb", networkId: "airtel", tab: "Best Offers", data: "6GB", validity: "7 DAYS", price: 1905, originalPrice: 2000, cashback: 20, extra: "+ Youtube" },

  { id: "glo-2gb", networkId: "glo", tab: "Best Offers", data: "2GB", validity: "2 DAYS", price: 480, originalPrice: 550, cashback: 5 },
  { id: "glo-5gb", networkId: "glo", tab: "Best Offers", data: "5GB", validity: "7 DAYS", price: 1200, originalPrice: 1350, cashback: 15 },
];

const TABS = ["Best Offers", "Daily", "Weekly", "Monthly", "Social", "Broadband", "XtraValue"];

const WALLET = 0;

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function NetworkBadge({ networkId, size = "md" }: { networkId: NetworkId; size?: "sm" | "md" }) {
  const net = NETWORKS.find((n) => n.id === networkId);
  if (!net) return null;
  const dim = size === "sm" ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-[10px]";
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{ backgroundColor: net.bg, color: net.color === "#FFCC00" ? "#1A1A1A" : net.color }}
    >
      {net.name.slice(0, 1)}
    </div>
  );
}

export default function DataPage() {
  const [phone, setPhone] = useState("");
  const [networkId, setNetworkId] = useState<NetworkId | null>(null);
  const [netOpen, setNetOpen] = useState(false);
  const [tab, setTab] = useState("Best Offers");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const detected = detectNetwork(phone);
    if (detected) {
      setNetworkId(detected);
    }
  }, [phone]);

  const activeNetwork = NETWORKS.find((n) => n.id === networkId) ?? null;

  const filteredPlans = useMemo(() => {
    if (!networkId) return [];
    return PLANS.filter((p) => p.networkId === networkId && p.tab === tab);
  }, [networkId, tab]);

  const featuredPlan = useMemo(() => {
    if (!networkId) return null;
    return (
      PLANS.find((p) => p.networkId === networkId && p.featured) ||
      PLANS.find((p) => p.networkId === networkId && p.tab === "Best Offers")
    );
  }, [networkId]);

  function handleBuy(plan: Plan) {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      alert("Please enter a valid phone number");
      return;
    }
    if (!networkId) {
      alert("Please select a network");
      return;
    }
    setSelectedPlan(plan);
    setBuying(true);
  }

  function confirmBuy() {
    setBuying(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2800);
    setSelectedPlan(null);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link
            href="/home"
            className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]"
          >
            <ArrowLeft size={18} />
            Back
          </Link>
          <h1 className="text-sm font-semibold text-[#0F172A]">Data</h1>
          <span className="text-sm font-semibold text-[#16A34A] tabular-nums">
            {formatNaira(WALLET)}
          </span>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-3.5">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setNetOpen(true)}
              className="flex items-center gap-1.5 h-11 px-2.5 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] shrink-0 active:scale-[0.98] transition"
            >
              {activeNetwork ? (
                <>
                  <NetworkBadge networkId={activeNetwork.id} size="sm" />
                  <span className="text-xs font-semibold text-[#0F172A]">
                    {activeNetwork.name}
                  </span>
                </>
              ) : (
                <span className="text-xs text-[#94A3B8] px-1">Network</span>
              )}
              <ChevronDown size={14} className="text-[#94A3B8]" />
            </button>

            <div className="flex-1 relative">
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9+]/g, "").slice(0, 14);
                  setPhone(v);
                }}
                placeholder="Enter mobile number"
                className="w-full h-11 px-3 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
              />
              {phone && (
                <button
                  type="button"
                  onClick={() => {
                    setPhone("");
                    setNetworkId(null);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E2E8F0] flex items-center justify-center"
                >
                  <X size={12} className="text-[#64748B]" />
                </button>
              )}
            </div>
          </div>
          {networkId && phone.length >= 4 && (
            <p className="mt-2 text-[11px] text-[#16A34A] flex items-center gap-1">
              <CheckCircle2 size={12} />
              Detected {activeNetwork?.name} network
            </p>
          )}
        </div>

        {featuredPlan && (
          <div className="rounded-[14px] bg-gradient-to-br from-[#0B1220] to-[#152238] p-4 flex items-center gap-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#1877F2]/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="w-12 h-12 rounded-[12px] bg-[#1877F2] flex items-center justify-center shrink-0">
              <Zap size={22} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold tracking-wide text-[#1877F2] uppercase">
                Best Offer
              </p>
              <p className="text-[17px] font-bold text-white leading-tight mt-0.5">
                {featuredPlan.data}{" "}
                <span className="text-sm font-medium text-slate-300">
                  {featuredPlan.validity}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-semibold text-white tabular-nums">
                  {formatNaira(featuredPlan.price)}
                </span>
                {featuredPlan.originalPrice && (
                  <span className="text-xs text-slate-400 line-through tabular-nums">
                    {formatNaira(featuredPlan.originalPrice)}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleBuy(featuredPlan)}
              className="h-9 px-4 rounded-full bg-[#1877F2] text-white text-xs font-semibold shrink-0 active:scale-95 transition"
            >
              Buy
            </button>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-[#0F172A]">Data Plans</h2>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-medium transition ${
                  tab === t
                    ? "bg-[#1877F2] text-white"
                    : "bg-white text-[#64748B] border border-[#E2E8F0]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {!networkId ? (
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] py-14 text-center">
            <Wifi size={32} className="mx-auto text-[#CBD5E1]" />
            <p className="mt-3 text-sm font-medium text-[#64748B]">
              Enter a number or select network
            </p>
            <p className="mt-1 text-xs text-[#94A3B8]">
              Plans will appear for the selected network
            </p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] py-12 text-center">
            <p className="text-sm text-[#94A3B8]">No plans in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredPlans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => handleBuy(plan)}
                className="rounded-[14px] bg-white border border-[#E2E8F0] p-3.5 text-left active:scale-[0.98] transition hover:border-[#1877F2]/40"
              >
                {plan.cashback !== undefined && plan.cashback > 0 && (
                  <span className="inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 mb-2">
                    ₦{plan.cashback} Cashback
                  </span>
                )}
                <p className="text-[15px] font-bold text-[#0F172A] leading-tight">
                  {plan.data}{" "}
                  <span className="text-[11px] font-medium text-[#64748B]">
                    {plan.validity}
                  </span>
                </p>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-[#1877F2] tabular-nums">
                    {formatNaira(plan.price)}
                  </span>
                  {plan.originalPrice && (
                    <span className="text-[11px] text-[#94A3B8] line-through tabular-nums">
                      {formatNaira(plan.originalPrice)}
                    </span>
                  )}
                </div>
                {plan.extra && (
                  <p className="mt-1.5 text-[10px] text-[#64748B]">{plan.extra}</p>
                )}
                {plan.badge && (
                  <p className="mt-1 text-[10px] font-medium text-[#1877F2]">
                    {plan.badge}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="pt-1">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-2.5">
            More Services
          </h2>
          <button
            type="button"
            className="w-full flex items-center gap-3 p-4 rounded-[14px] bg-white border border-[#E2E8F0] text-left active:scale-[0.99] transition"
          >
            <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] flex items-center justify-center">
              <RefreshCw size={18} className="text-[#1877F2]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0F172A]">Data Auto-Renew</p>
              <p className="text-xs text-[#64748B] mt-0.5">
                Stay online automatically
              </p>
            </div>
            <span className="text-xs font-medium text-[#94A3B8]">Soon</span>
          </button>
        </div>
      </div>

      {netOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setNetOpen(false)}
          />
          <div className="relative bg-white rounded-t-[20px] max-h-[60vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-base font-semibold text-[#0F172A]">
                Select Network
              </h3>
              <button
                type="button"
                onClick={() => setNetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto px-2 pb-8">
              {NETWORKS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setNetworkId(n.id);
                    setNetOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-[12px] text-left ${
                    networkId === n.id
                      ? "bg-[#EFF6FF]"
                      : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <NetworkBadge networkId={n.id} />
                  <span
                    className={`text-sm font-medium ${
                      networkId === n.id ? "text-[#1877F2]" : "text-[#0F172A]"
                    }`}
                  >
                    {n.name}
                  </span>
                  {networkId === n.id && (
                    <CheckCircle2 size={16} className="ml-auto text-[#1877F2]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {buying && selectedPlan && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => {
              setBuying(false);
              setSelectedPlan(null);
            }}
          />
          <div className="relative bg-white rounded-t-[20px] shadow-xl px-4 pt-5 pb-8">
            <div className="w-10 h-1 rounded-full bg-[#E2E8F0] mx-auto mb-4" />
            <h3 className="text-base font-semibold text-[#0F172A] text-center">
              Confirm Purchase
            </h3>
            <div className="mt-4 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Network</span>
                <span className="font-medium text-[#0F172A]">
                  {activeNetwork?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Number</span>
                <span className="font-medium text-[#0F172A] tabular-nums">
                  {phone || "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Plan</span>
                <span className="font-medium text-[#0F172A]">
                  {selectedPlan.data} · {selectedPlan.validity}
                </span>
              </div>
              <div className="border-t border-[#E2E8F0] pt-3 flex justify-between">
                <span className="text-sm font-medium text-[#0F172A]">Total</span>
                <span className="text-lg font-bold text-[#1877F2] tabular-nums">
                  {formatNaira(selectedPlan.price)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={confirmBuy}
              className="mt-5 w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold active:scale-[0.99] transition"
            >
              Pay {formatNaira(selectedPlan.price)}
            </button>
            <button
              type="button"
              onClick={() => {
                setBuying(false);
                setSelectedPlan(null);
              }}
              className="mt-2 w-full h-11 rounded-[12px] text-sm font-medium text-[#64748B]"
            >
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
