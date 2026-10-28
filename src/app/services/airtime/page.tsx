"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Lock,
  Phone,
  Plus,
  Smartphone,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { useUser } from "@/lib/useUser";

/* ---------------------------------- data ---------------------------------- */

type NetworkId = "mtn" | "airtel" | "glo" | "9mobile";
type NetworkOption = { id: NetworkId; label: string; color: string };
type RecentRecipient = { phone: string; networkId: NetworkId | null; lastUsed: number };

const NETWORKS: NetworkOption[] = [
  { id: "mtn", label: "MTN", color: "#FFCC00" },
  { id: "airtel", label: "Airtel", color: "#E60000" },
  { id: "glo", label: "Glo", color: "#00A859" },
  { id: "9mobile", label: "9mobile", color: "#005B38" },
];
const QUICK_AMOUNTS = [100, 200, 500, 1000];
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 50000;
const RECENT_RECIPIENTS_KEY = "vernexdigital_airtime_recent_recipients_v1";
const LOGOS: Record<NetworkId, string> = {
  mtn: "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/mtn.svg",
  airtel: "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/airtel.svg",
  glo: "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/glo.svg",
  "9mobile": "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/9mobile.svg",
};

function normalizePhone(value: string) {
  const digits = value.replace(/D/g, "");
  if (digits.startsWith("234") && digits.length === 13) return "0" + digits.slice(3);
  return digits;
}

function detectNetwork(value: string): NetworkId | null {
  const phone = normalizePhone(value);
  if (phone.length < 4) return null;
  const prefix = phone.slice(0, 4);
  const prefixMap: Record<string, NetworkId> = {
    "0803": "mtn", "0806": "mtn", "0703": "mtn", "0706": "mtn", "0810": "mtn", "0813": "mtn", "0814": "mtn", "0816": "mtn", "0903": "mtn", "0906": "mtn", "0913": "mtn", "0916": "mtn", "0704": "mtn",
    "0802": "airtel", "0808": "airtel", "0701": "airtel", "0708": "airtel", "0812": "airtel", "0901": "airtel", "0902": "airtel", "0904": "airtel", "0907": "airtel", "0912": "airtel", "0801": "airtel",
    "0805": "glo", "0807": "glo", "0705": "glo", "0811": "glo", "0815": "glo", "0905": "glo", "0915": "glo",
    "0809": "9mobile", "0817": "9mobile", "0818": "9mobile", "0908": "9mobile", "0909": "9mobile", "0918": "9mobile",
  };
  return prefixMap[prefix] ?? null;
}

function formatPhone(value: string) {
  const phone = normalizePhone(value);
  if (phone.length === 11) return phone.slice(0, 4) + " " + phone.slice(4, 7) + " " + phone.slice(7);
  return phone;
}

function naira(value: number) {
  return "₦" + value.toLocaleString("en-NG");
}

/* --------------------------------- pieces --------------------------------- */

function NetworkLogo({ id, size = 56 }: { id: NetworkId; size?: number }) {
  const [failed, setFailed] = useState(false);
  const network = NETWORKS.find((item) => item.id === id)!;
  return (
    <span
      className="flex items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-slate-100"
      style={{ width: size, height: size }}
    >
      {failed ? (
        <span className="text-[15px] font-extrabold" style={{ color: network.color }}>
          {id === "9mobile" ? "9" : network.label.slice(0, 1)}
        </span>
      ) : (
        <img src={LOGOS[id]} alt={network.label + " logo"} className="h-[62%] w-[62%] object-contain" onError={() => setFailed(true)} />
      )}
    </span>
  );
}

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[15px] font-semibold leading-tight text-slate-900">{title}</h2>
      <p className="mt-0.5 text-[12px] text-slate-400">{subtitle}</p>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function AirtimePage() {
  const { profile, wallet, loading: userLoading } = useUser();
  const [phone, setPhone] = useState("");
  const [networkId, setNetworkId] = useState<NetworkId | null>(null);
  const [amountText, setAmountText] = useState("");
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(false);
  const [recentRecipients, setRecentRecipients] = useState<RecentRecipient[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_RECIPIENTS_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentRecipients(
            parsed
              .filter((item): item is RecentRecipient => item && typeof item.phone === "string" && normalizePhone(item.phone).length === 11)
              .slice(0, 3),
          );
        }
      }
    } catch {
      /* ignore malformed local history */
    }
  }, []);

  const registeredPhone = useMemo(() => {
    const normalized = normalizePhone(profile?.phone ?? "");
    return normalized.length === 11 ? normalized : "";
  }, [profile?.phone]);
  const normalizedPhone = useMemo(() => normalizePhone(phone), [phone]);
  const selectedNetwork = networkId ?? detectNetwork(normalizedPhone);
  const selectedNetworkInfo = NETWORKS.find((item) => item.id === selectedNetwork);
  const amount = Number(amountText) || 0;
  const validPhone = normalizedPhone.length === 11 && normalizedPhone.startsWith("0");
  const validAmount = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
  const balance = Number(wallet.balance) || 0;
  const insufficient = validAmount && amount > balance;
  const readyToConfirm = Boolean(selectedNetwork && validPhone && validAmount && !insufficient);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const choosePhone = useCallback((value: string, suppliedNetwork?: NetworkId | null) => {
    const clean = normalizePhone(value);
    setPhone(clean);
    setNetworkId(suppliedNetwork ?? detectNetwork(clean));
    setRecipientPickerOpen(false);
  }, []);

  const saveRecentRecipient = useCallback((number: string, network: NetworkId) => {
    const updated = [
      { phone: number, networkId: network, lastUsed: Date.now() },
      ...recentRecipients.filter((recipient) => recipient.phone !== number),
    ].slice(0, 3);
    setRecentRecipients(updated);
    try { localStorage.setItem(RECENT_RECIPIENTS_KEY, JSON.stringify(updated)); } catch { /* optional */ }
  }, [recentRecipients]);

  const submitDemoPurchase = () => {
    if (!readyToConfirm || !selectedNetwork) return;
    saveRecentRecipient(normalizedPhone, selectedNetwork);
    setConfirmOpen(false);
    setToast("Airtime purchase submitted (demo)");
    setPhone("");
    setNetworkId(null);
    setAmountText("");
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-16">
      {/* header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur">
        <Link href="/home" className="flex items-center gap-1 text-[14px] font-medium text-slate-900" aria-label="Back to home">
          <ArrowLeft size={18} />
          Back
        </Link>
        <div className="text-center">
          <h1 className="text-[14px] font-semibold leading-tight text-slate-900">Buy Airtime</h1>
          <p className="text-[11px] text-slate-400">Instant mobile top-up</p>
        </div>
        <Link href="/fund" className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700 tabular-nums">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {userLoading ? "₦…" : naira(balance)}
        </Link>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {/* promo banner */}
        <section className="rounded-2xl bg-gradient-to-br from-[#4C1D95] to-[#7C3AED] px-5 py-5">
          <span className="inline-block rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#4C1D95]">
            Fast Top-Up
          </span>
          <h2 className="mt-2.5 text-[20px] font-bold leading-tight text-white">Airtime Recharge</h2>
          <p className="mt-1 text-[12px] text-purple-100">Buy airtime instantly for all major networks</p>
        </section>

        {/* select network */}
        <section>
          <SectionHead title="Select Network" subtitle="Auto-detect works when you type number" />
          <div className="grid grid-cols-4 gap-2">
            {NETWORKS.map((network) => {
              const selected = selectedNetwork === network.id;
              return (
                <button
                  key={network.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setNetworkId(network.id)}
                  className="relative flex flex-col items-center gap-2"
                >
                  <span
                    className={
                      "relative rounded-2xl p-1.5 transition-all " +
                      (selected ? "bg-purple-50 ring-2 ring-[#7C3AED]" : "bg-white ring-1 ring-slate-200 active:ring-[#7C3AED]/40")
                    }
                  >
                    {selected && (
                      <span className="absolute -right-0.5 -top-0.5 z-10 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#7C3AED] text-white" style={{ width: 18, height: 18 }}>
                        <Check size={11} strokeWidth={3.5} />
                      </span>
                    )}
                    <NetworkLogo id={network.id} size={52} />
                  </span>
                  <span className={"text-[12px] " + (selected ? "font-semibold text-[#4C1D95]" : "text-slate-500")}>
                    {network.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* recharge details */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <SectionHead title="Recharge Details" subtitle="Enter recipient and amount" />

          <div>
            <div className={"flex h-[50px] items-center rounded-xl border bg-slate-50 pl-3.5 " + (phone && !validPhone ? "border-red-300" : "border-slate-200 focus-within:border-[#7C3AED]")}>
              <Phone size={17} className="shrink-0 text-slate-400" />
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0803 000 0000"
                value={phone}
                onChange={(event) => {
                  const next = event.target.value.replace(/[^0-9+]/g, "").slice(0, 14);
                  setPhone(next);
                  const detected = detectNetwork(next);
                  if (detected) setNetworkId(detected);
                }}
                aria-label="Recipient phone number"
                className="h-full w-full bg-transparent px-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {phone && (
                <button type="button" onClick={() => { setPhone(""); setNetworkId(null); }} className="px-3 text-slate-400" aria-label="Clear number">
                  <X size={15} />
                </button>
              )}
            </div>
            {phone && !validPhone && <p className="mt-1.5 px-1 text-[12px] text-red-500">Enter a valid 11-digit Nigerian number.</p>}
            {phone && validPhone && selectedNetworkInfo && (
              <p className="mt-1.5 flex items-center gap-1 px-1 text-[12px] text-emerald-600">
                <CheckCircle2 size={13} /> {selectedNetworkInfo.label} detected from the number.
              </p>
            )}

            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRecipientPickerOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-[12px] font-medium text-[#6D28D9]"
              >
                <Sparkles size={13} /> Use My Number
              </button>
              {recentRecipients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecipientPickerOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600"
                >
                  <Clock3 size={13} /> Recent numbers
                </button>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex h-[50px] items-center rounded-xl border border-slate-200 bg-slate-50 pl-3.5 focus-within:border-[#7C3AED]">
              <Wallet size={17} className="shrink-0 text-slate-400" />
              <span className="px-2 text-[15px] font-semibold text-slate-400">₦</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder={MIN_AMOUNT + " – " + MAX_AMOUNT.toLocaleString("en-NG")}
                value={amountText}
                onChange={(event) => setAmountText(event.target.value.replace(/[^0-9]/g, ""))}
                aria-label="Airtime amount in naira"
                className="h-full w-full bg-transparent text-[14px] font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
              />
              {amountText && (
                <button type="button" onClick={() => setAmountText("")} className="px-3 text-slate-400" aria-label="Clear amount">
                  <X size={15} />
                </button>
              )}
            </div>
            {amount > 0 && !validAmount && (
              <p className="mt-1.5 px-1 text-[12px] text-red-500">Choose an amount between ₦100 and ₦50,000.</p>
            )}
          </div>

          {/* wallet strip */}
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-[#F6F8FB] px-4 py-3">
            <span className="flex items-center gap-2 text-[12px] text-slate-500">
              <Wallet size={14} className="text-slate-400" />
              Available balance: <strong className="text-slate-900 tabular-nums">{userLoading ? "Loading…" : naira(balance)}</strong>
            </span>
            <Link href="/fund" className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white active:opacity-80">
              Fund
            </Link>
          </div>

          {/* quick amounts */}
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Quick Amounts</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={amount === value}
                  onClick={() => setAmountText(String(value))}
                  className={
                    "h-10 rounded-xl border text-[12px] font-semibold tabular-nums transition-colors " +
                    (amount === value
                      ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")
                  }
                >
                  {naira(value)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* summary + cta */}
        {amount > 0 && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[13px] text-slate-500">You pay</span>
              <strong className="text-[16px] font-bold text-slate-900 tabular-nums">{naira(amount)}</strong>
            </div>
            {insufficient && (
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-amber-50 px-5 py-3">
                <span className="flex items-center gap-1.5 text-[12px] text-amber-800">
                  <AlertCircle size={14} /> Need {naira(amount - balance)} more
                </span>
                <Link href="/fund" className="shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white active:opacity-90">
                  Fund Wallet
                </Link>
              </div>
            )}
          </section>
        )}

        {insufficient ? (
          <Link href="/fund" className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 text-[14px] font-semibold text-white active:opacity-90">
            <Wallet size={17} />
            Fund Wallet · Need {naira(amount - balance)}
          </Link>
        ) : (
          <button
            type="button"
            disabled={!readyToConfirm}
            onClick={() => setConfirmOpen(true)}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#4C1D95] text-[14px] font-semibold text-white transition-opacity disabled:opacity-40"
          >
            <Lock size={16} />
            {readyToConfirm ? "Buy Airtime" : "Enter recipient and amount"}
          </button>
        )}

        {/* instant delivery trust */}
        <section className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={20} />
          </span>
          <div>
            <h3 className="text-[13px] font-semibold text-slate-900">Instant Delivery</h3>
            <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">Airtime is delivered immediately after successful payment.</p>
          </div>
        </section>
      </div>

      {/* ------------------------------- overlays ------------------------------- */}
      {recipientPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setRecipientPickerOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" />
          <section
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Choose a recipient</h3>
                <p className="mt-0.5 text-[12px] text-slate-400">Pick your account number or a recent top-up.</p>
              </div>
              <button type="button" onClick={() => setRecipientPickerOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {registeredPhone && (
                <button type="button" onClick={() => choosePhone(registeredPhone)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:border-slate-300">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#6D28D9]"><Phone size={16} /></span>
                  <div>
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                      {formatPhone(registeredPhone)}
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-[#6D28D9]">My account</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Phone number on your account</p>
                  </div>
                </button>
              )}
              {recentRecipients.map((recipient) => (
                <button type="button" key={recipient.phone} onClick={() => choosePhone(recipient.phone, recipient.networkId)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 p-3 text-left hover:border-slate-300">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><Clock3 size={16} /></span>
                  <div>
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                      {formatPhone(recipient.phone)}
                      {recipient.networkId && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          {NETWORKS.find((network) => network.id === recipient.networkId)?.label}
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400">Previously recharged on this device</p>
                  </div>
                </button>
              ))}
              {!registeredPhone && recentRecipients.length === 0 && (
                <p className="py-6 text-center text-[13px] text-slate-400">No saved numbers yet — enter a number to get started.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {confirmOpen && selectedNetworkInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" />
          <section
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Confirm Airtime</h3>
                <p className="mt-0.5 text-[12px] text-slate-400">Check the details before continuing.</p>
              </div>
              <button type="button" onClick={() => setConfirmOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-[#F6F8FB] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500">Network</span>
                <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-900">
                  <NetworkLogo id={selectedNetworkInfo.id} size={24} />
                  {selectedNetworkInfo.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-slate-500">Recipient</span>
                <span className="text-[13px] font-semibold text-slate-900 tabular-nums">{formatPhone(normalizedPhone)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-[12px] text-slate-500">Amount</span>
                <span className="text-[16px] font-bold text-slate-900 tabular-nums">{naira(amount)}</span>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Smartphone size={13} /> Demo flow — no payment will be charged.
            </p>
            <button type="button" onClick={submitDemoPurchase} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4C1D95] text-[13px] font-semibold text-white active:opacity-90">
              <Check size={16} strokeWidth={2.6} /> Confirm Purchase
            </button>
            <button type="button" onClick={() => setConfirmOpen(false)} className="mt-2 flex h-10 w-full items-center justify-center rounded-xl text-[13px] font-medium text-slate-500">
              Go back
            </button>
          </section>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg" role="status">
          <CheckCircle2 size={15} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
