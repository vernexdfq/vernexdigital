"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  MonitorPlay,
  Tv,
} from "lucide-react";

const PROVIDERS = [
  { id: "dstv", name: "DStv", tile: "bg-[#1a1a2e] text-white" },
  { id: "gotv", name: "GOtv", tile: "bg-[#e85d04] text-white" },
  { id: "startimes", name: "StarTimes", tile: "bg-[#c1121f] text-white" },
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
    { name: "Supa Plus", price: 16800 },
  ],
  startimes: [
    { name: "Nova", price: 2100 },
    { name: "Basic", price: 4000 },
    { name: "Smart", price: 5100 },
    { name: "Classic", price: 6000 },
    { name: "Super", price: 9800 },
  ],
};

function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("sb-access-token") || sessionStorage.getItem("sb-access-token");
    if (raw) return raw;
    // Supabase browser client often stores under sb-*-auth-token
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || "";
      if (k.includes("auth-token") || k.includes("supabase.auth")) {
        const v = localStorage.getItem(k);
        if (!v) continue;
        try {
          const parsed = JSON.parse(v);
          const t =
            parsed?.access_token ||
            parsed?.currentSession?.access_token ||
            parsed?.session?.access_token;
          if (t) return String(t);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
  return "";
}

function getProfilePhone(): string {
  if (typeof window === "undefined") return "";
  try {
    const keys = ["vernex-profile", "profile", "user-profile"];
    for (const k of keys) {
      const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (!raw) continue;
      const p = JSON.parse(raw);
      const phone = p?.phone || p?.contact || p?.mobile || "";
      if (phone) return String(phone);
    }
  } catch {
    /* ignore */
  }
  return "";
}

export default function CableTvPage() {
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [smartCard, setSmartCard] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [pkg, setPkg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

  const packages = PACKAGES[provider.id] || [];

  const digits = smartCard.replace(/\D/g, "");
  const cardOk = digits.length >= 10;

  const handleVerify = useCallback(async () => {
    setMsg("");
    setMsgOk(false);
    setVerified(false);
    setCustomerName("");
    if (!cardOk) {
      setMsg("Enter a valid smartcard / IUC number");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/cable-tv/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: provider.id,
          smartCardNo: digits,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setMsg(String(data.error || "Smartcard not found. Check the number and try again."));
        return;
      }
      setVerified(true);
      setCustomerName(String(data.customerName || "Verified customer"));
      setMsgOk(true);
      setMsg(`Verified · ${data.customerName || "Customer found"}`);
    } catch {
      setMsg("Network error — try again");
    } finally {
      setVerifying(false);
    }
  }, [cardOk, digits, provider.id]);

  const handlePay = useCallback(async () => {
    setMsg("");
    setMsgOk(false);
    if (!verified) {
      setMsg("Verify your smartcard before payment");
      return;
    }
    if (!pkg) {
      setMsg("Select a package");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setMsg("Sign in to pay TV subscription");
      return;
    }

    let phone = getProfilePhone();
    phone = phone.replace(/\D/g, "");
    if (phone.startsWith("234") && phone.length >= 13) phone = "0" + phone.slice(3);
    if (!/^0[7-9]\d{9}$/.test(phone)) {
      setMsg("Add a valid Nigerian phone number to your profile to complete payment");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cable-tv/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: provider.id,
          packageName: pkg,
          smartCardNo: digits,
          phone,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        if (res.status === 401) setMsg("Sign in to pay TV subscription");
        else if (res.status === 402)
          setMsg(String(data.error || "Insufficient wallet balance. Fund your wallet first."));
        else setMsg(String(data.error || "TV subscription failed"));
        return;
      }

      const success =
        data.order?.message ||
        `${provider.name} ${pkg} activated · ₦${(PACKAGES[provider.id].find((p) => p.name === pkg)?.price || 0).toLocaleString()}`;
      setMsgOk(true);
      setMsg(success);
      setSmartCard("");
      setVerified(false);
      setCustomerName("");
      setPkg(null);
    } catch {
      setMsg("Network error — try again");
    } finally {
      setLoading(false);
    }
  }, [verified, pkg, provider, digits]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/services" className="text-[#64748B]">
            <ArrowLeft size={20} />
          </Link>
          <div className="text-center">
            <h1 className="text-sm font-semibold text-[#0F172A]">TV Subscription</h1>
            <p className="text-[10px] text-[#64748B]">DSTV, GOtv and StarTimes</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <Tv size={16} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-4 space-y-4">
        <div className="relative overflow-hidden rounded-[16px] bg-gradient-to-br from-[#0B1F4D] to-[#152238] p-4">
          <MonitorPlay size={110} className="absolute -right-4 -top-4 text-white/10" strokeWidth={1} />
          <span className="inline-block rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-200">
            Pay TV
          </span>
          <h2 className="mt-2.5 text-[17px] font-bold tracking-tight text-white">
            Cable Subscription
          </h2>
          <p className="mt-0.5 text-[12px] leading-snug text-slate-300">
            Verify smartcard and activate your package instantly.
          </p>
        </div>

        <section className="rounded-[16px] border border-[#E2E8F0] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[#0F172A]">TV Provider</h3>
          <p className="mt-0.5 text-[11px] text-[#64748B]">Choose your cable provider</p>

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="mt-3 flex h-12 w-full items-center gap-3 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 text-left transition active:scale-[0.99]"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${provider.tile}`}>
              <Tv size={15} />
            </div>
            <span className="flex-1 min-w-0">
              <span className="block truncate text-[13px] font-semibold text-[#0F172A]">
                {provider.name}
              </span>
              <span className="block text-[10px] text-[#64748B]">Cable provider</span>
            </span>
            <ChevronDown size={16} className="shrink-0 text-[#64748B]" />
          </button>
        </section>

        <section className="rounded-[16px] border border-[#E2E8F0] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[#0F172A]">Smartcard Verification</h3>
          <p className="mt-0.5 text-[11px] text-[#64748B]">Verify customer before payment</p>

          <label className="mt-3 mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Smartcard / IUC Number
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={smartCard}
              onChange={(e) => {
                setSmartCard(e.target.value.replace(/\D/g, "").slice(0, 13));
                setVerified(false);
                setCustomerName("");
                setMsg("");
              }}
              placeholder="Enter smartcard / IUC number"
              className="h-12 w-full rounded-[12px] border border-[#E2E8F0] bg-white px-3 pr-10 text-sm outline-none focus:border-[#1877F2]"
            />
            {verified && (
              <Check
                size={16}
                strokeWidth={3}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1877F2]"
              />
            )}
          </div>

          {verified && customerName && (
            <div className="mt-2 flex items-center gap-2 rounded-[10px] bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
              <Check size={14} strokeWidth={3} />
              <span>
                <strong>{customerName}</strong>
                <span className="text-emerald-700/80"> · {digits}</span>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || !cardOk}
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0B1F4D] text-[13px] font-semibold text-white transition active:scale-[0.99] disabled:opacity-70"
          >
            {verifying ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Verifying…
              </>
            ) : verified ? (
              "Smartcard Verified"
            ) : (
              "Verify Smartcard"
            )}
          </button>
        </section>

        <section className="rounded-[16px] border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-bold text-[#0F172A]">Select Package</h3>
              <p className="mt-0.5 text-[11px] text-[#64748B]">All prices valid for 30 days</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${provider.tile}`}
            >
              <Tv size={11} />
              {provider.name}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {packages.map((p) => {
              const selected = pkg === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setPkg(p.name)}
                  className={`relative rounded-[14px] border p-3 text-left transition active:scale-[0.98] ${
                    selected
                      ? "border-[#1877F2] bg-[#EFF6FF]"
                      : "border-[#E2E8F0] bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#EFF6FF] text-[#1877F2]">
                      <Tv size={15} />
                    </div>
                    {selected && <Check size={15} strokeWidth={3} className="text-[#1877F2]" />}
                  </div>
                  <p className="mt-2 text-[12px] font-semibold text-[#0F172A]">{p.name}</p>
                  <p className="mt-0.5 text-[13px] font-bold text-[#1877F2]">
                    ₦{p.price.toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[#64748B]">Valid for 30 days</p>
                </button>
              );
            })}
          </div>
        </section>

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
          onClick={handlePay}
          disabled={loading || !verified || !pkg}
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
              Pay TV Subscription
            </>
          )}
        </button>
      </main>

      {sheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="relative mx-auto w-full max-w-lg rounded-t-[20px] bg-white p-4 pb-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E2E8F0]" />
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-[#0F172A]">Select TV Provider</h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="text-[12px] font-semibold text-[#1877F2]"
              >
                Done
              </button>
            </div>
            <div className="max-h-[45vh] space-y-2 overflow-y-auto">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProvider(p);
                    setPkg(null);
                    setVerified(false);
                    setCustomerName("");
                    setMsg("");
                    setSheetOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-[12px] border px-3 py-3 text-left transition ${
                    provider.id === p.id
                      ? "border-[#1877F2] bg-[#EFF6FF]"
                      : "border-[#E2E8F0] bg-white"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${p.tile}`}
                  >
                    <Tv size={16} />
                  </div>
                  <span className="flex-1 text-[13px] font-semibold text-[#0F172A]">{p.name}</span>
                  {provider.id === p.id && (
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
