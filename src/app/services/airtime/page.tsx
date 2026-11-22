"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Loader2, Lock, Smartphone } from "lucide-react";
import { useUser } from "@/lib/useUser";
import { createBrowserClient } from "@/lib/supabase/client";

const NETWORKS = [
  { id: "mtn", name: "MTN" },
  { id: "glo", name: "Glo" },
  { id: "airtel", name: "Airtel" },
  { id: "9mobile", name: "9mobile" },
];

const QUICK_AMOUNTS = [100, 500, 1000, 2000];
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 50000;

function naira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function AirtimePage() {
  const { profile, wallet, loading: userLoading, refresh } = useUser();
  const [network, setNetwork] = useState(NETWORKS[0]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [orderRef, setOrderRef] = useState("");

  useEffect(() => {
    const p = String(profile?.phone || "").replace(/\D/g, "");
    if (p.length >= 10 && !phone) {
      let clean = p;
      if (clean.startsWith("234") && clean.length >= 13) clean = "0" + clean.slice(3);
      if (/^0[7-9]\d{9}$/.test(clean)) setPhone(clean);
    }
  }, [profile?.phone, phone]);

  async function handleBuy() {
    setMsg("");
    setMsgOk(false);
    setOrderRef("");
    const amt = Number(amount.replace(/\D/g, ""));
    if (!amt || amt < MIN_AMOUNT) {
      setMsg(`Minimum airtime is ${naira(MIN_AMOUNT)}`);
      return;
    }
    if (amt > MAX_AMOUNT) {
      setMsg(`Maximum airtime is ${naira(MAX_AMOUNT)}`);
      return;
    }
    const phoneClean = phone.replace(/\D/g, "");
    if (!/^0[7-9]\d{9}$/.test(phoneClean)) {
      setMsg("Enter a valid 11-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data: sess } = await supabase.auth.getSession();
      const sessionToken = sess.session?.access_token;
      if (!sessionToken) {
        setMsg("Sign in to buy airtime");
        return;
      }

      const res = await fetch("/api/airtime/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          network: network.id,
          phone: phoneClean,
          amount: amt,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setMsg(
          String(
            data.error ||
              (data.refunded ? "Purchase failed — wallet refunded" : "Airtime purchase failed"),
          ),
        );
        return;
      }

      const order = data.order || {};
      setOrderRef(String(order.ref || ""));
      setMsgOk(true);
      setMsg(String(order.message || `${network.name} airtime successful`));
      setAmount("");
      void refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  const balance = Number(wallet.balance) || 0;

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/services" className="text-[#64748B]">
            <ArrowLeft size={20} />
          </Link>
          <div className="text-center">
            <h1 className="text-sm font-semibold text-[#0F172A]">Airtime Top-Up</h1>
            <p className="text-[10px] text-[#64748B]">Instant recharge, all networks</p>
          </div>
          <Link
            href="/fund"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 tabular-nums"
          >
            {userLoading ? "…" : naira(balance)}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4 space-y-4">
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#0B1F4D] to-[#152238] p-4">
          <Smartphone size={120} className="absolute -right-5 -top-5 text-white/10" strokeWidth={1} />
          <span className="inline-block rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-200">
            Airtime
          </span>
          <h2 className="mt-2.5 text-[17px] font-bold tracking-tight text-white">
            Mobile Airtime Recharge
          </h2>
          <p className="mt-0.5 text-[12px] leading-snug text-slate-300">
            Top up any Nigerian line instantly, 24/7 automated delivery.
          </p>
        </div>

        <section className="rounded-[16px] border border-[#E2E8F0] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[#0F172A]">Select Network</h3>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            Choose the network of the number you are recharging
          </p>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mt-3 flex h-12 w-full items-center gap-3 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-left transition active:scale-[0.99]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#1877F2]">
              <Smartphone size={15} />
            </div>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-[13px] font-semibold text-[#0F172A]">
                {network.name}
              </span>
              <span className="block text-[10px] text-[#64748B]">Network provider</span>
            </span>
            <ChevronDown size={16} className="shrink-0 text-[#64748B]" />
          </button>
        </section>

        <section className="rounded-[16px] border border-[#E2E8F0] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[#0F172A]">Recharge Details</h3>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            Airtime is delivered to this phone number
          </p>

          <label className="mt-3 mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Phone Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            placeholder="e.g. 08012345678"
            className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 text-sm outline-none focus:border-[#1877F2]"
          />
        </section>

        <section className="rounded-[16px] border border-[#E2E8F0] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[#0F172A]">Recharge Amount</h3>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            Between {naira(MIN_AMOUNT)} and {naira(MAX_AMOUNT)}
          </p>

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

          <div className="mt-3 grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(String(a))}
                className={`h-10 rounded-full text-[11px] font-bold transition ${
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

        {orderRef && msgOk && (
          <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              Order reference
            </p>
            <p className="mt-1 break-all font-mono text-[15px] font-bold tracking-wide text-emerald-950">
              {orderRef}
            </p>
            <p className="mt-1 text-[11px] text-emerald-700">
              Keep this reference for support queries.
            </p>
          </div>
        )}

        {msg && (
          <p
            className={`rounded-[10px] px-3 py-2 text-[13px] font-medium ${
              msgOk ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-600"
            }`}
          >
            {msg}
          </p>
        )}

        <button
          type="button"
          onClick={handleBuy}
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
              Buy Airtime
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-[#64748B]">
          Wallet is debited only on delivery; failed purchases are refunded automatically.
        </p>
      </main>

      {sheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="relative mx-auto w-full max-w-lg rounded-t-[20px] bg-white p-4 pb-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E2E8F0]" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-[#0F172A]">Select Network</h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="text-[12px] font-semibold text-[#1877F2]"
              >
                Done
              </button>
            </div>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto">
              {NETWORKS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setNetwork(n);
                    setSheetOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-[12px] border px-3 py-3 text-left transition ${
                    network.id === n.id
                      ? "border-[#1877F2] bg-[#EFF6FF]"
                      : "border-[#E2E8F0] bg-white"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#1877F2]">
                    <Smartphone size={16} />
                  </div>
                  <span className="flex-1 text-[13px] font-semibold text-[#0F172A]">{n.name}</span>
                  {network.id === n.id && (
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
