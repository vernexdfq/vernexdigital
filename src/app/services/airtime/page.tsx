"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  X,
  CheckCircle2,
  Smartphone,
} from "lucide-react";

type NetworkId = "mtn" | "airtel" | "glo" | "9mobile";

const NETWORKS: {
  id: NetworkId;
  name: string;
  brand: string;
  text: string;
  prefixes: string[];
}[] = [
  {
    id: "mtn",
    name: "MTN",
    brand: "#FFCC00",
    text: "#1A1A1A",
    prefixes: [
      "0803", "0806", "0703", "0706", "0810", "0813", "0814", "0816",
      "0903", "0906", "0913", "0916", "0704",
    ],
  },
  {
    id: "airtel",
    name: "Airtel",
    brand: "#ED1C24",
    text: "#FFFFFF",
    prefixes: [
      "0802", "0808", "0701", "0708", "0812", "0901", "0902", "0904",
      "0907", "0912", "0801",
    ],
  },
  {
    id: "glo",
    name: "Glo",
    brand: "#00A651",
    text: "#FFFFFF",
    prefixes: ["0805", "0807", "0705", "0811", "0815", "0905", "0915"],
  },
  {
    id: "9mobile",
    name: "9mobile",
    brand: "#006F3C",
    text: "#FFFFFF",
    prefixes: ["0809", "0817", "0818", "0908", "0909", "0918"],
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

const PRESETS = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
const MIN_AMOUNT = 50;
const MAX_AMOUNT = 50000;

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

const NETWORK_LOGOS: Record<NetworkId, string> = {
  mtn: "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/mtn.svg",
  airtel: "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/airtel.svg",
  glo: "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/glo.svg",
  "9mobile": "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/9mobile.svg",
};

function NetworkLogo({
  networkId,
  size = "md",
}: {
  networkId: NetworkId;
  size?: "sm" | "md" | "lg";
}) {
  const net = NETWORKS.find((n) => n.id === networkId);
  if (!net) return null;
  const dim =
    size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const logo = NETWORK_LOGOS[networkId];
  return (
    <div
      className={`${dim} rounded-full overflow-hidden bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-sm`}
      title={net.name}
    >
      <img
        src={logo}
        alt={net.name}
        className="w-full h-full object-contain p-0.5"
      />
    </div>
  );
}

export default function AirtimePage() {
  // Default to MTN so the page never looks blank on entry
  const [phone, setPhone] = useState("");
  const [networkId, setNetworkId] = useState<NetworkId>("mtn");
  const [netOpen, setNetOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  useEffect(() => {
    const detected = detectNetwork(phone);
    if (detected) setNetworkId(detected);
  }, [phone]);

  const activeNetwork = NETWORKS.find((n) => n.id === networkId) ?? NETWORKS[0];
  const numericAmount = Number(amount.replace(/,/g, "")) || 0;
  const isValidPhone = phone.replace(/\D/g, "").length >= 10;
  const isValidAmount =
    numericAmount >= MIN_AMOUNT && numericAmount <= MAX_AMOUNT;
  const canPay = isValidPhone && !!networkId && isValidAmount;

  function selectPreset(value: number) {
    setSelectedPreset(value);
    setAmount(String(value));
  }

  function handleCustomAmount(v: string) {
    const cleaned = v.replace(/[^0-9]/g, "");
    setAmount(cleaned);
    setSelectedPreset(null);
  }

  function handlePay() {
    if (!isValidPhone) {
      setPhoneError(true);
      return;
    }
    if (!canPay) return;
    setPhoneError(false);
    setBuying(true);
  }

  function confirmPay() {
    setBuying(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2800);
    if (!saveBeneficiary) {
      setPhone("");
      setNetworkId("mtn");
    }
    setAmount("");
    setSelectedPreset(null);
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
          <h1 className="text-sm font-semibold text-[#0F172A]">Airtime</h1>
          <Link href="/history" className="text-sm font-medium text-[#1877F2]">
            History
          </Link>
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
              <NetworkLogo networkId={activeNetwork.id} size="sm" />
              <span className="text-xs font-semibold text-[#0F172A]">
                {activeNetwork.name}
              </span>
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
                  setPhoneError(false);
                }}
                placeholder="e.g. 0803 000 0000"
                className={`w-full h-11 px-3 rounded-[10px] bg-[#F8FAFC] border text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1877F2]/15 ${
                  phoneError
                    ? "border-red-400 focus:border-red-400"
                    : "border-[#E2E8F0] focus:border-[#1877F2]"
                }`}
              />
              {phone && (
                <button
                  type="button"
                  onClick={() => {
                    setPhone("");
                    setNetworkId("mtn");
                    setPhoneError(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E2E8F0] flex items-center justify-center"
                >
                  <X size={12} className="text-[#64748B]" />
                </button>
              )}
            </div>
          </div>
          {phoneError && (
            <p className="mt-2 text-[11px] text-red-500">
              Please enter a valid phone number
            </p>
          )}
          {phone.length >= 4 && !phoneError && (
            <p className="mt-2 text-[11px] text-[#16A34A] flex items-center gap-1">
              <CheckCircle2 size={12} />
              Detected {activeNetwork.name} network
            </p>
          )}
        </div>

        <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-4">
          <h2 className="text-sm font-semibold text-[#0F172A] mb-3">
            Select Amount
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => selectPreset(p)}
                className={`rounded-[12px] border py-3.5 px-2 text-center transition active:scale-[0.97] ${
                  selectedPreset === p
                    ? "border-[#1877F2] bg-[#EFF6FF] ring-2 ring-[#1877F2]/20"
                    : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#1877F2]/40"
                }`}
              >
                <p className="text-[15px] font-bold text-[#0F172A] tabular-nums">
                  {formatNaira(p)}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2.5">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">
                ₦
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(e) => handleCustomAmount(e.target.value)}
                placeholder={`${MIN_AMOUNT.toLocaleString()} – ${MAX_AMOUNT.toLocaleString()}`}
                className="w-full h-12 pl-8 pr-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15 tabular-nums"
              />
            </div>
            <button
              type="button"
              onClick={handlePay}
              disabled={!canPay}
              className="h-12 px-6 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition hover:bg-[#166FE5]"
            >
              Pay
            </button>
          </div>
          {amount && !isValidAmount && (
            <p className="mt-2 text-[11px] text-red-500">
              Amount must be between {formatNaira(MIN_AMOUNT)} and{" "}
              {formatNaira(MAX_AMOUNT)}
            </p>
          )}
        </div>

        <div className="rounded-[14px] bg-white border border-[#E2E8F0] px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#0F172A]">Save Beneficiary</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              Quick access next time
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={saveBeneficiary}
            onClick={() => setSaveBeneficiary((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              saveBeneficiary ? "bg-[#1877F2]" : "bg-[#E2E8F0]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                saveBeneficiary ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="rounded-[12px] bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-3 flex gap-2.5">
          <Smartphone size={16} className="text-[#1877F2] shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#1E3A5F] leading-relaxed">
            Enter any Nigerian number. Network is detected automatically. Airtime
            is delivered instantly after payment.
          </p>
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
          <div className="relative bg-white rounded-t-[20px] max-h-[55vh] flex flex-col shadow-xl">
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
                    networkId === n.id ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <NetworkLogo networkId={n.id} />
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

      {buying && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setBuying(false)}
          />
          <div className="relative bg-white rounded-t-[20px] shadow-xl px-4 pt-5 pb-8">
            <div className="w-10 h-1 rounded-full bg-[#E2E8F0] mx-auto mb-4" />
            <h3 className="text-base font-semibold text-[#0F172A] text-center">
              Confirm Airtime
            </h3>
            <div className="mt-4 rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Network</span>
                <span className="font-medium text-[#0F172A] flex items-center gap-1.5">
                  <NetworkLogo networkId={activeNetwork.id} size="sm" />
                  {activeNetwork.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Number</span>
                <span className="font-medium text-[#0F172A] tabular-nums">
                  {phone}
                </span>
              </div>
              <div className="border-t border-[#E2E8F0] pt-3 flex justify-between">
                <span className="text-sm font-medium text-[#0F172A]">Amount</span>
                <span className="text-lg font-bold text-[#1877F2] tabular-nums">
                  {formatNaira(numericAmount)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={confirmPay}
              className="mt-5 w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold active:scale-[0.99] transition"
            >
              Pay {formatNaira(numericAmount)}
            </button>
            <button
              type="button"
              onClick={() => setBuying(false)}
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
            Airtime purchase submitted (demo)
          </div>
        </div>
      )}
    </div>
  );
}
