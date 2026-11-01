"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Zap,
} from "lucide-react";
import WalletBalance from "@/components/WalletBalance";

const DISCOS = [
  { id: "ikeja", name: "Ikeja Electric" },
  { id: "eko", name: "Eko Electric" },
  { id: "ibadan", name: "Ibadan Electric" },
  { id: "abuja", name: "Abuja Electric" },
  { id: "kaduna", name: "Kaduna Electric" },
  { id: "kano", name: "Kano Electric" },
  { id: "jos", name: "Jos Electric" },
  { id: "phed", name: "Port Harcourt Electric" },
  { id: "enugu", name: "Enugu Electric" },
  { id: "benin", name: "Benin Electric" },
  { id: "yola", name: "Yola Electric" },
];

const QUICK_AMOUNTS = [1000, 2000, 5000];

export default function ElectricityPage() {
  const [disco, setDisco] = useState(DISCOS[0]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [meterType, setMeterType] = useState<"prepaid" | "postpaid">("prepaid");
  const [meter, setMeter] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  function handleVerify() {
    setMsg("");
    setVerified(false);
    if (meter.replace(/\D/g, "").length < 10) {
      setMsg("Enter a valid meter number");
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
    }, 900);
  }

  function handlePay() {
    setMsg("");
    if (!verified) {
      setMsg("Verify your meter before payment");
      return;
    }
    const amt = Number(amount.replace(/\D/g, ""));
    if (!amt || amt < 1000) {
      setMsg("Minimum payment is ₦1,000");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMsg("Electricity purchase will be available when payments go live.");
    }, 900);
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/services" className="text-[#64748B]">
            <ArrowLeft size={20} />
          </Link>
          <div className="text-center">
            <h1 className="text-sm font-semibold text-[#0F172A]">Electricity Bill</h1>
            <p className="text-[10px] text-[#64748B]">Prepaid and postpaid meter</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Zap size={16} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4 space-y-4">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#0B1F4D] to-[#152238] p-4">
          <Zap
            size={120}
            className="absolute -right-5 -top-5 text-white/10"
            strokeWidth={1}
          />
          <span className="inline-block rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-200">
            Power Bill
          </span>
          <h2 className="mt-2.5 text-[17px] font-bold tracking-tight text-white">
            Electricity Payment
          </h2>
          <p className="mt-0.5 text-[12px] leading-snug text-slate-300">
            Verify meter, confirm details and pay securely.
          </p>
        </div>

        {/* Provider Details */}
        <section className="rounded-[16px] border border-[#E2E8F0] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[#0F172A]">Provider Details</h3>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            Choose electricity company and meter type
          </p>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mt-3 flex h-12 w-full items-center gap-3 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-left transition active:scale-[0.99]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#1877F2]">
              <Zap size={15} />
            </div>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-[13px] font-semibold text-[#0F172A]">
                {disco.name}
              </span>
              <span className="block text-[10px] text-[#64748B]">Electricity company</span>
            </span>
            <ChevronDown size={16} className="shrink-0 text-[#64748B]" />
          </button>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["prepaid", "postpaid"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMeterType(t)}
                className={`h-10 rounded-full text-[12px] font-semibold capitalize transition ${
                  meterType === t
                    ? "bg-[#1877F2] text-white shadow-md"
                    : "border border-[#E2E8F0] bg-[#F8FAFC] text-[#334155]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Meter Verification */}
        <section className="rounded-[16px] border border-[#E2E8F0] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[#0F172A]">Meter Verification</h3>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            Confirm customer details before payment
          </p>

          <label className="mt-3 mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Meter Number
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={meter}
              onChange={(e) => {
                setMeter(e.target.value.replace(/\D/g, "").slice(0, 13));
                setVerified(false);
              }}
              placeholder="Enter meter number"
              className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 pr-10 text-sm outline-none focus:border-[#1877F2]"
            />
            {verified && (
              <Check size={16} strokeWidth={3} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1877F2]" />
            )}
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0B1F4D] text-[13px] font-semibold text-white transition active:scale-[0.99] disabled:opacity-70"
          >
            {verifying ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Verifying…
              </>
            ) : verified ? (
              "Meter Verified"
            ) : (
              "Verify Meter"
            )}
          </button>
        </section>

        {/* Payment Amount */}
        <section className="rounded-[16px] border border-[#E2E8F0] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[#0F172A]">Payment Amount</h3>
          <p className="mt-0.5 text-[11px] text-[#64748B]">Minimum payment is ₦1,000</p>

          <label className="mt-3 mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Amount
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">
              ₦
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="0"
              className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white pl-8 pr-3 text-sm font-semibold outline-none focus:border-[#1877F2]"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(String(a))}
                className={`h-10 rounded-full text-[12px] font-bold transition ${
                  Number(amount) === a
                    ? "bg-[#1877F2] text-white shadow-md"
                    : "border border-[#E2E8F0] bg-[#EFF6FF] text-[#1877F2]"
                }`}
              >
                ₦{a.toLocaleString()}
              </button>
            ))}
          </div>
        </section>

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
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1F4D] to-[#1877F2] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(24,119,242,0.28)] transition active:scale-[0.99] disabled:opacity-70"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <Lock size={15} />
              Pay Electricity
            </>
          )}
        </button>
      </main>

      {/* Company selection bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative mx-auto w-full max-w-lg rounded-t-[20px] bg-white p-4 pb-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E2E8F0]" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-[#0F172A]">Select Electricity Company</h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="text-[12px] font-semibold text-[#1877F2]"
              >
                Done
              </button>
            </div>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto">
              {DISCOS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setDisco(d);
                    setVerified(false);
                    setSheetOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-[12px] border px-3 py-3 text-left transition ${
                    disco.id === d.id
                      ? "border-[#1877F2] bg-[#EFF6FF]"
                      : "border-[#E2E8F0] bg-white"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#1877F2]">
                    <Zap size={16} />
                  </div>
                  <span className="flex-1 text-[13px] font-semibold text-[#0F172A]">{d.name}</span>
                  {disco.id === d.id && (
                    <Check size={16} strokeWidth={3} className="shrink-0 text-[#1877F2]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
