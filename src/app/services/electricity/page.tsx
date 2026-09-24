"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Loader2 } from "lucide-react";

const DISCOS = [
  { id: "ikedc", name: "IKEDC" },
  { id: "ekedc", name: "EKEDC" },
  { id: "aedc", name: "AEDC" },
  { id: "phed", name: "PHED" },
  { id: "ibedc", name: "IBEDC" },
  { id: "jed", name: "JED" },
  { id: "kaedco", name: "KAEDCO" },
  { id: "kedco", name: "KEDCO" },
];

const AMOUNTS = [1000, 2000, 3000, 5000, 10000, 20000];

export default function ElectricityPage() {
  const [disco, setDisco] = useState("ikedc");
  const [meter, setMeter] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  function handlePay() {
    setMsg("");
    if (meter.replace(/\D/g, "").length < 10) {
      setMsg("Enter a valid meter number");
      return;
    }
    if (!amount) {
      setMsg("Select an amount");
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
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur">
        <Link href="/services" className="text-[#64748B]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Zap size={16} />
          </div>
          <h1 className="text-base font-semibold text-[#0F172A]">Electricity</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-5">
        <p className="text-sm text-[#64748B]">
          Buy prepaid electricity tokens for any disco. Token is delivered instantly.
        </p>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Disco
          </p>
          <div className="grid grid-cols-4 gap-2">
            {DISCOS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDisco(d.id)}
                className={`rounded-[12px] px-1 py-2.5 text-center text-[11px] font-bold transition ${
                  disco === d.id
                    ? "bg-[#1877F2] text-white shadow-md"
                    : "border border-[#E2E8F0] bg-white text-[#0F172A]"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Meter number
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={meter}
            onChange={(e) => setMeter(e.target.value.replace(/\D/g, "").slice(0, 13))}
            placeholder="Enter meter number"
            className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 text-sm outline-none focus:border-[#1877F2]"
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Amount
          </p>
          <div className="grid grid-cols-3 gap-2">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                className={`rounded-[12px] border px-2 py-3 text-sm font-bold transition ${
                  amount === a
                    ? "border-[#1877F2] bg-[#EFF6FF] text-[#1877F2]"
                    : "border-[#E2E8F0] bg-white text-[#0F172A]"
                }`}
              >
                ₦{a.toLocaleString()}
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
            "Buy units"
          )}
        </button>
      </div>
    </div>
  );
}
