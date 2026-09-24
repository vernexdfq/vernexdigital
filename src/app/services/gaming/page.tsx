"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gamepad2, Loader2 } from "lucide-react";

const PLATFORMS = [
  { id: "steam", name: "Steam", color: "bg-[#1b2838] text-white" },
  { id: "psn", name: "PlayStation", color: "bg-[#003087] text-white" },
  { id: "xbox", name: "Xbox", color: "bg-[#107c10] text-white" },
  { id: "freefire", name: "Free Fire", color: "bg-[#ff6b00] text-white" },
  { id: "pubg", name: "PUBG", color: "bg-[#f2a900] text-[#0F172A]" },
  { id: "mlbb", name: "MLBB", color: "bg-[#1a237e] text-white" },
];

const AMOUNTS: Record<string, number[]> = {
  steam: [1000, 2000, 5000, 10000, 20000],
  psn: [2000, 5000, 10000, 15000, 25000],
  xbox: [2000, 5000, 10000, 15000, 25000],
  freefire: [500, 1000, 2000, 5000, 10000],
  pubg: [500, 1000, 2000, 5000, 10000],
  mlbb: [500, 1000, 2000, 5000, 10000],
};

export default function GamingPage() {
  const [platform, setPlatform] = useState("steam");
  const [amount, setAmount] = useState<number | null>(null);
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const amounts = AMOUNTS[platform] || [];

  function handlePay() {
    setMsg("");
    if (!playerId.trim()) {
      setMsg("Enter your player ID or account email");
      return;
    }
    if (!amount) {
      setMsg("Select an amount");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMsg("Gaming top-up will be available when payments go live.");
    }, 900);
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-28">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur">
        <Link href="/services" className="text-[#64748B]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Gamepad2 size={16} />
          </div>
          <h1 className="text-base font-semibold text-[#0F172A]">Gaming Top-up</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-5">
        <p className="text-sm text-[#64748B]">
          Fund Steam, PlayStation, Xbox and popular mobile games from your Vernex wallet.
        </p>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Platform
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPlatform(p.id);
                  setAmount(null);
                }}
                className={`rounded-[12px] px-2 py-3 text-center text-[11px] font-bold transition ${
                  platform === p.id
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
            Player ID / Account
          </label>
          <input
            type="text"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="Email, username or player ID"
            className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 text-sm outline-none focus:border-[#1877F2]"
          />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Amount
          </p>
          <div className="grid grid-cols-3 gap-2">
            {amounts.map((a) => (
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
            "Top up now"
          )}
        </button>
      </div>
    </div>
  );
}
