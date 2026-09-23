"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Tv, Loader2 } from "lucide-react";

const PROVIDERS = [
  { id: "dstv", name: "DSTV", color: "bg-[#1a1a2e] text-white" },
  { id: "gotv", name: "GOtv", color: "bg-[#e85d04] text-white" },
  { id: "startimes", name: "Startimes", color: "bg-[#c1121f] text-white" },
  { id: "showmax", name: "Showmax", color: "bg-[#ff6b00] text-white" },
];

const PACKAGES: Record<string, { name: string; price: number }[]> = {
  dstv: [
    { name: "Padi", price: 4400 },
    { name: "Yanga", price: 6000 },
    { name: "Confam", price: 11000 },
    { name: "Compact", price: 19000 },
    { name: "Compact Plus", price: 30000 },
    { name: "Premium", price: 44500 },
  ],
  gotv: [
    { name: "Smallie", price: 1900 },
    { name: "Jinja", price: 3900 },
    { name: "Jolli", price: 5800 },
    { name: "Max", price: 8500 },
    { name: "Supa", price: 11400 },
  ],
  startimes: [
    { name: "Nova", price: 2100 },
    { name: "Basic", price: 4000 },
    { name: "Smart", price: 5100 },
    { name: "Classic", price: 6000 },
    { name: "Super", price: 9800 },
  ],
  showmax: [
    { name: "Mobile", price: 1600 },
    { name: "Standard", price: 3200 },
    { name: "Pro", price: 6200 },
  ],
};

export default function CableTvPage() {
  const [provider, setProvider] = useState("dstv");
  const [smartCard, setSmartCard] = useState("");
  const [pkg, setPkg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const packages = PACKAGES[provider] || [];

  function handlePay() {
    setMsg("");
    if (smartCard.replace(/\D/g, "").length < 10) {
      setMsg("Enter a valid smartcard / IUC number");
      return;
    }
    if (!pkg) {
      setMsg("Select a package");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMsg("Cable subscription will be available when payments go live.");
    }, 900);
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-28">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur">
        <Link href="/services" className="text-[#64748B]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Tv size={16} />
          </div>
          <h1 className="text-base font-semibold text-[#0F172A]">Cable TV</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-5">
        <p className="text-sm text-[#64748B]">
          Pay DSTV, GOtv, Startimes or Showmax with your Vernex wallet.
        </p>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Provider
          </p>
          <div className="grid grid-cols-4 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProvider(p.id);
                  setPkg(null);
                }}
                className={`rounded-[12px] px-1 py-3 text-center text-[11px] font-bold transition ${
                  provider === p.id
                    ? `${p.color} shadow-md ring-2 ring-offset-1 ring-[#1877F2]/40`
                    : "border border-[#E2E8F0] bg-white text-[#0F172A]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Smartcard / IUC number
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={smartCard}
            onChange={(e) => setSmartCard(e.target.value.replace(/\D/g, "").slice(0, 15))}
            placeholder="Enter smartcard number"
            className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 text-sm outline-none focus:border-[#1877F2]"
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Package
          </p>
          <div className="space-y-2">
            {packages.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setPkg(item.name)}
                className={`flex w-full items-center justify-between rounded-[12px] border px-4 py-3 text-left transition ${
                  pkg === item.name
                    ? "border-[#1877F2] bg-[#EFF6FF]"
                    : "border-[#E2E8F0] bg-white"
                }`}
              >
                <span className="text-sm font-semibold text-[#0F172A]">{item.name}</span>
                <span className="text-sm font-bold text-[#1877F2]">
                  ₦{item.price.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>

        {msg && (
          <p
            className={`rounded-[10px] px-3 py-2 text-[13px] font-medium ${
              msg.includes("live")
                ? "bg-amber-50 text-amber-800"
                : "bg-red-50 text-red-600"
            }`}
          >
            {msg}
          </p>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1877F2] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(24,119,242,0.28)] disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing…
            </>
          ) : (
            "Pay subscription"
          )}
        </button>
      </div>
    </div>
  );
}
