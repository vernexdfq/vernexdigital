"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Phone,
  Search,
  ShoppingCart,
  X,
  Globe,
  FileClock,
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import {
  fetchServices,
  fetchCountries,
  serviceMatchesQuery,
  countryMatchesQuery,
  highlightMatch,
  type CatalogService,
  type CatalogCountry,
} from "@/lib/vn-catalog-client";

type ProviderId =
  | "usa-s1"
  | "usa-s2"
  | "usa-s3"
  | "usa-s4"
  | "all-s1"
  | "all-s2"
  | "all-s3"
  | "all-s4";

const PROVIDERS: {
  id: ProviderId;
  label: string;
  flag: string;
  needsCountry: boolean;
  tier: string;
}[] = [
  { id: "usa-s1", label: "USA (S1)", flag: "🇺🇸", needsCountry: false, tier: "Economy" },
  { id: "usa-s2", label: "USA (S2)", flag: "🇺🇸", needsCountry: false, tier: "Standard" },
  { id: "usa-s3", label: "USA (S3)", flag: "🇺🇸", needsCountry: false, tier: "Fast" },
  { id: "usa-s4", label: "USA (S4)", flag: "🇺🇸", needsCountry: false, tier: "Premium" },
  { id: "all-s1", label: "All Countries (S1)", flag: "🌐", needsCountry: true, tier: "Economy" },
  { id: "all-s2", label: "All Countries (S2)", flag: "🌐", needsCountry: true, tier: "Standard" },
  { id: "all-s3", label: "All Countries (S3)", flag: "🌐", needsCountry: true, tier: "Fast" },
  { id: "all-s4", label: "All Countries (S4)", flag: "🌐", needsCountry: true, tier: "Premium" },
];

type PriceOption = {
  label: string;
  priceNgn: number;
  wholesaleNgn: number;
  costUsd: number;
  stock: number;
  grizzlyCountry: string;
};

type Order = {
  phone: string;
  service: string;
  provider: string;
  providerSlug?: string;
  providerOrderId?: string;
  status: "waiting" | "received" | "expired" | "cancelled" | "refunded";
  code?: string;
  id?: string;
  priceNgn?: number;
  expiresAt?: number;
  /** Cancel enabled after this (Grizzly max early-cancel ~5 min) */
  cancelAvailableAt?: number;
  refunded?: boolean;
};

const OTP_TTL_MS = 20 * 60 * 1000;
/** Grizzly max early-cancel window is ~5 min — after this Cancel is reliable */
const CANCEL_LOCK_MS = 5 * 60 * 1000;
const OTP_POLL_MS = 5000;

function formatTimer(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const { createBrowserClient } = await import("@/lib/supabase/client");
    const supabase = createBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const { parts } = highlightMatch(text, query);
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <span key={i} className="text-[#1877F2] font-semibold underline decoration-[#1877F2]/30">
            {p.t}
          </span>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </>
  );
}

function SearchSheet({
  open,
  title,
  query,
  onQuery,
  onClose,
  children,
  countLabel,
}: {
  open: boolean;
  title: string;
  query: string;
  onQuery: (q: string) => void;
  onClose: () => void;
  children: React.ReactNode;
  countLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40" onClick={onClose}>
      <div
        className="mt-auto bg-white rounded-t-2xl max-h-[85dvh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-[15px] font-semibold text-[#0F172A]">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 text-[#94A3B8]">
            <X size={20} />
          </button>
        </div>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search…"
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
            />
          </div>
          {countLabel ? (
            <p className="text-[11px] text-[#94A3B8] mt-2">{countLabel}</p>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-safe pb-6">{children}</div>
      </div>
    </div>
  );
}

export default function VirtualNumberPage() {
  const { wallet, refresh } = useUser();
  const balance = wallet?.balance ?? 0;

  const [provider, setProvider] = useState<ProviderId>("usa-s1");
  const [service, setService] = useState<CatalogService | null>(null);
  const [country, setCountry] = useState<CatalogCountry | null>(null);
  const [serviceQuery, setServiceQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [liveServices, setLiveServices] = useState<CatalogService[]>([]);
  const [liveCountries, setLiveCountries] = useState<CatalogCountry[]>([]);
  const [prices, setPrices] = useState<PriceOption[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<PriceOption | null>(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpMsg, setOtpMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [tick, setTick] = useState(0);

  const needsCountry = PROVIDERS.find((p) => p.id === provider)?.needsCountry ?? false;
  const currentTier = PROVIDERS.find((p) => p.id === provider)?.tier ?? "Economy";

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("vn_recent_orders");
      if (raw) {
        const parsed = JSON.parse(raw) as Order[];
        if (Array.isArray(parsed) && parsed.length) {
          setRecentOrders(parsed);
          const waiting = parsed.find((o) => o.status === "waiting");
          if (waiting) setActiveOrder(waiting);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { services } = await fetchServices(provider);
      if (!cancelled) setLiveServices(services);
    })();
    return () => {
      cancelled = true;
    };
  }, [provider]);

  useEffect(() => {
    setService(null);
    setCountry(null);
    setPrices([]);
    setSelectedPrice(null);
  }, [provider]);

  useEffect(() => {
    if (!service) {
      setLiveCountries([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const countries = await fetchCountries(provider, service.code);
      if (!cancelled) setLiveCountries(countries);
    })();
    return () => {
      cancelled = true;
    };
  }, [provider, service]);

  useEffect(() => {
    if (!service) return;
    if (needsCountry && !country) {
      setPrices([]);
      setSelectedPrice(null);
      return;
    }
    let cancelled = false;
    setLoadingPrices(true);
    (async () => {
      try {
        const qs = new URLSearchParams({
          mode: "prices",
          pool: provider,
          service: service.code,
        });
        if (country) qs.set("country", country.grizzlyCode || country.code);
        const res = await fetch(`/api/vn/catalog?${qs}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.ok && Array.isArray(data.options)) {
          const opts: PriceOption[] = data.options.map((o: any, i: number) => ({
            label: o.label || `Route ${i + 1}`,
            priceNgn: Number(o.priceNgn) || 0,
            wholesaleNgn: Number(o.wholesaleNgn) || 0,
            costUsd: Number(o.costUsd) || 0,
            stock: Number(o.stock) || 0,
            grizzlyCountry: String(o.grizzlyCountry || country?.grizzlyCode || country?.code || "US"),
          }));
          setPrices(opts);
          setSelectedPrice(opts[0] || null);
        } else {
          setPrices([]);
          setSelectedPrice(null);
        }
      } catch {
        if (!cancelled) {
          setPrices([]);
          setSelectedPrice(null);
        }
      } finally {
        if (!cancelled) setLoadingPrices(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [service, country, provider, needsCountry]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeOrder || activeOrder.status !== "waiting" || !activeOrder.providerOrderId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const token = await getAuthToken();
        if (!token || cancelled) return;
        const qs = new URLSearchParams({
          providerOrderId: activeOrder.providerOrderId!,
          provider: activeOrder.providerSlug || "grizzly",
        });
        if (activeOrder.id) qs.set("orderId", activeOrder.id);
        const res = await fetch(`/api/vn/status?${qs}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled || !data.ok) return;
        if (data.otp || data.code) {
          patchOrder(activeOrder.id || activeOrder.providerOrderId, {
            code: String(data.otp || data.code),
            status: "received",
          });
        } else if (data.status === "cancelled" || data.status === "expired") {
          patchOrder(activeOrder.id || activeOrder.providerOrderId, { status: data.status });
        }
      } catch {}
    };
    const id = setInterval(poll, OTP_POLL_MS);
    void poll();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeOrder?.providerOrderId, activeOrder?.status]);

  useEffect(() => {
    if (!activeOrder || activeOrder.status !== "waiting") return;
    const now = Date.now();
    if (activeOrder.expiresAt && activeOrder.expiresAt <= now) {
      patchOrder(activeOrder.id || activeOrder.providerOrderId, { status: "expired" });
    }
  }, [tick, activeOrder]);

  function persist(list: Order[]) {
    try {
      sessionStorage.setItem("vn_recent_orders", JSON.stringify(list.slice(0, 30)));
    } catch {}
  }

  function patchOrder(id: string | undefined, patch: Partial<Order>) {
    if (!id) return;
    setActiveOrder((prev) => (prev && (prev.id === id || prev.providerOrderId === id) ? { ...prev, ...patch } : prev));
    setRecentOrders((prev) => {
      const next = prev.map((o) =>
        o.id === id || o.providerOrderId === id ? { ...o, ...patch } : o,
      );
      persist(next);
      return next;
    });
  }

  async function handleCheckOtp() {
    if (!activeOrder?.providerOrderId) return;
    setOtpBusy(true);
    setOtpMsg("");
    try {
      const token = await getAuthToken();
      if (!token) {
        setOtpMsg("Sign in again");
        return;
      }
      const qs = new URLSearchParams({
        providerOrderId: activeOrder.providerOrderId,
        provider: activeOrder.providerSlug || "grizzly",
      });
      if (activeOrder.id) qs.set("orderId", activeOrder.id);
      const res = await fetch(`/api/vn/status?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setOtpMsg(data.error || "Could not check OTP");
        return;
      }
      if (data.otp || data.code) {
        patchOrder(activeOrder.id || activeOrder.providerOrderId, {
          code: String(data.otp || data.code),
          status: "received",
        });
        setOtpMsg("OTP received!");
      } else setOtpMsg("Still waiting for SMS…");
    } catch {
      setOtpMsg("Network error");
    } finally {
      setOtpBusy(false);
    }
  }

  async function handleCancelOrder() {
    if (!activeOrder?.providerOrderId) return;
    if (activeOrder.cancelAvailableAt && Date.now() < activeOrder.cancelAvailableAt) {
      setOtpMsg(`Cancel available in ${formatTimer(activeOrder.cancelAvailableAt - Date.now())}`);
      return;
    }
    setOtpBusy(true);
    setOtpMsg("");
    try {
      const token = await getAuthToken();
      if (!token) {
        setOtpMsg("Sign in again");
        return;
      }
      const res = await fetch("/api/vn/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          providerOrderId: activeOrder.providerOrderId,
          orderId: activeOrder.id,
          priceNgn: activeOrder.priceNgn || 0,
          provider: activeOrder.providerSlug || "grizzly",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.earlyDenied) {
        setOtpMsg(data.error || "Cancel not available yet — wait a moment");
        return;
      }
      if (!res.ok || !data.ok) {
        setOtpMsg(data.error || "Cancel failed");
        return;
      }
      patchOrder(activeOrder.id || activeOrder.providerOrderId, {
        status: data.refunded ? "refunded" : "cancelled",
        refunded: Boolean(data.refunded),
      });
      setOtpMsg(data.refunded ? "Cancelled & refunded to wallet" : "Order cancelled");
      void refresh();
    } catch {
      setOtpMsg("Network error");
    } finally {
      setOtpBusy(false);
    }
  }

  async function copyActiveCode() {
    if (!activeOrder?.code) return;
    try {
      await navigator.clipboard.writeText(activeOrder.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  async function handleBuy() {
    if (!service || !selectedPrice) return;
    if (needsCountry && !country) {
      setBuyError("Select a country first");
      return;
    }
    setBuying(true);
    setBuyError("");
    try {
      const token = await getAuthToken();
      if (!token) {
        setBuyError("Sign in to buy a number");
        return;
      }
      const res = await fetch("/api/vn/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          service: service.name,
          country: selectedPrice.grizzlyCountry || country?.grizzlyCode || country?.code || "US",
          pool: provider,
          priceNgn: selectedPrice.priceNgn,
          wholesaleNgn: selectedPrice.wholesaleNgn,
          maxPriceUsd: selectedPrice.costUsd || 0.5,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setBuyError(data.error || "Purchase failed");
        return;
      }
      const now = Date.now();
      const order: Order = {
        id: data.order?.id,
        phone: data.order?.phone || "",
        service: service.name,
        provider: "Grizzly",
        providerSlug: "grizzly",
        providerOrderId: data.order?.providerOrderId,
        status: "waiting",
        priceNgn: selectedPrice.priceNgn,
        expiresAt: now + OTP_TTL_MS,
        cancelAvailableAt: now + CANCEL_LOCK_MS,
      };
      setActiveOrder(order);
      setRecentOrders((prev) => {
        const next = [order, ...prev].slice(0, 30);
        persist(next);
        return next;
      });
      void refresh();
    } catch {
      setBuyError("Network error");
    } finally {
      setBuying(false);
    }
  }

  const filteredServices = useMemo(
    () => liveServices.filter((s) => serviceMatchesQuery(s, serviceQuery)),
    [liveServices, serviceQuery],
  );
  const filteredCountries = useMemo(
    () => liveCountries.filter((c) => countryMatchesQuery(c, countryQuery)),
    [liveCountries, countryQuery],
  );

  void tick;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/services" className="p-1 -ml-1 text-[#64748B]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[15px] font-semibold text-[#0F172A]">Virtual Numbers</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#16A34A] tabular-nums">
            ₦{Number(balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
          <button type="button" className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
            <Bell size={18} />
          </button>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-5">
        <div>
          <p className="text-xs font-semibold text-[#64748B] mb-2">Select route</p>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`h-11 rounded-xl border text-left px-3 text-[13px] font-medium transition ${
                  provider === p.id
                    ? "border-[#1877F2] bg-[#EEF4FF] text-[#1877F2]"
                    : "border-[#E2E8F0] bg-white text-[#0F172A]"
                }`}
              >
                <span className="mr-1">{p.flag}</span>
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-1.5">{currentTier} · live catalog</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-3 shadow-sm">
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Order a Number</h2>

          <button
            type="button"
            onClick={() => setServiceOpen(true)}
            className="w-full h-12 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 flex items-center gap-2 text-left"
          >
            <Search size={16} className="text-[#94A3B8] shrink-0" />
            <span className={`flex-1 text-sm truncate ${service ? "text-[#0F172A] font-medium" : "text-[#94A3B8]"}`}>
              {service ? service.name : `Search & select a service (${liveServices.length || 100} available)`}
            </span>
            <ChevronDown size={16} className="text-[#94A3B8]" />
          </button>

          <button
            type="button"
            disabled={!service}
            onClick={() => needsCountry && setCountryOpen(true)}
            className="w-full h-12 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 flex items-center gap-2 text-left disabled:opacity-60"
          >
            <Globe size={16} className="text-[#94A3B8] shrink-0" />
            <span className={`flex-1 text-sm truncate ${country ? "text-[#0F172A] font-medium" : "text-[#94A3B8]"}`}>
              {!service
                ? "Select a service first"
                : !needsCountry
                  ? "United States (auto)"
                  : country
                    ? `${country.flag || ""} ${country.name}`
                    : "Select country"}
            </span>
            {needsCountry ? <ChevronDown size={16} className="text-[#94A3B8]" /> : null}
          </button>

          {loadingPrices ? (
            <p className="text-sm text-[#94A3B8]">Loading prices…</p>
          ) : prices.length > 0 ? (
            <div className="space-y-2">
              {prices.map((p) => (
                <button
                  key={p.label + p.priceNgn}
                  type="button"
                  onClick={() => setSelectedPrice(p)}
                  className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-3 text-left ${
                    selectedPrice?.label === p.label && selectedPrice?.priceNgn === p.priceNgn
                      ? "border-[#1877F2] bg-[#EEF4FF]"
                      : "border-[#E2E8F0] bg-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">₦{p.priceNgn.toLocaleString("en-NG")}</p>
                    <p className="text-[11px] text-[#94A3B8]">{p.label}</p>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600">
                    {p.stock > 0 ? `${p.stock > 999 ? "9k+" : p.stock} in stock` : "Low stock"}
                  </span>
                </button>
              ))}
            </div>
          ) : service && (!needsCountry || country) ? (
            <p className="text-sm text-[#94A3B8]">No routes available for this selection</p>
          ) : null}

          {buyError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{buyError}</p>
          ) : null}

          <button
            type="button"
            disabled={!selectedPrice || buying || !service}
            onClick={handleBuy}
            className="w-full h-12 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShoppingCart size={16} />
            {buying ? "Ordering…" : "Order Number"}
          </button>
        </div>

        {activeOrder && (
          <div className="bg-[#EEF4FF] border border-[#BFDBFE] rounded-2xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[15px] font-semibold text-[#0F172A]">{activeOrder.service}</p>
                <p className="text-sm font-medium text-[#1877F2] tabular-nums mt-0.5">{activeOrder.phone}</p>
                <p className="text-[11px] text-[#64748B] mt-1">
                  {activeOrder.status === "received"
                    ? "OTP received"
                    : activeOrder.status === "waiting"
                      ? "Waiting for SMS"
                      : activeOrder.status === "refunded"
                        ? "Refunded"
                        : "Cancelled"}
                </p>
              </div>
              {activeOrder.status === "waiting" && activeOrder.expiresAt ? (
                <span className="text-sm font-bold tabular-nums text-[#1877F2] bg-white px-2.5 py-1 rounded-lg border border-[#1877F2]/20">
                  {formatTimer(activeOrder.expiresAt - Date.now())}
                </span>
              ) : null}
            </div>
            <div className="rounded-xl bg-white border border-[#E2E8F0] px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#64748B] mb-1">OTP Code</p>
              {activeOrder.code ? (
                <p className="text-2xl font-bold tracking-widest text-[#0F172A] tabular-nums">{activeOrder.code}</p>
              ) : (
                <p className="text-lg font-medium text-[#CBD5E1] tracking-widest">— — — — —</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {activeOrder.code ? (
                <button type="button" onClick={copyActiveCode} className="flex-1 h-10 bg-[#1877F2] text-white text-sm font-semibold rounded-xl">
                  {copied ? "Copied!" : "Copy OTP"}
                </button>
              ) : activeOrder.status === "waiting" ? (
                <div className="w-full space-y-2">
                  {activeOrder.cancelAvailableAt && Date.now() < activeOrder.cancelAvailableAt ? (
                    <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      Cancel available in {formatTimer(activeOrder.cancelAvailableAt - Date.now())}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={otpBusy} onClick={handleCheckOtp} className="flex-1 h-10 bg-[#1877F2] text-white text-sm font-semibold rounded-xl disabled:opacity-60">
                      {otpBusy ? "Checking…" : "Check OTP"}
                    </button>
                    <button
                      type="button"
                      disabled={otpBusy || Boolean(activeOrder.cancelAvailableAt && Date.now() < activeOrder.cancelAvailableAt)}
                      onClick={handleCancelOrder}
                      className="h-10 px-4 border border-red-200 text-red-600 text-sm font-semibold rounded-xl disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            {otpMsg ? <p className="text-xs text-[#0F172A] bg-white/80 rounded-lg px-2.5 py-1.5">{otpMsg}</p> : null}
            {(activeOrder.refunded || activeOrder.status === "refunded") && (
              <p className="text-xs text-emerald-700">₦{(activeOrder.priceNgn || 0).toLocaleString("en-NG")} refunded to wallet</p>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">Recent Orders</h3>
            <Link href="/services/virtual-number/orders" className="text-xs font-medium text-[#1877F2]">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl px-4 py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
                <FileClock size={22} className="text-[#94A3B8]" />
              </div>
              <p className="text-sm font-medium text-[#0F172A]">No orders yet</p>
              <p className="text-xs text-[#94A3B8] mt-1">Your number purchases will show here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.slice(0, 5).map((o, i) => (
                <button
                  key={o.id || o.providerOrderId || i}
                  type="button"
                  onClick={() => setActiveOrder(o)}
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-3 flex items-center justify-between text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{o.service}</p>
                    <p className="text-xs text-[#1877F2] tabular-nums">{o.phone}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#64748B]">{o.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <SearchSheet
        open={serviceOpen}
        title="Select service"
        query={serviceQuery}
        onQuery={setServiceQuery}
        onClose={() => setServiceOpen(false)}
        countLabel={`${filteredServices.length} of ${liveServices.length}`}
      >
        {filteredServices.map((s) => (
          <button
            key={s.code}
            type="button"
            onClick={() => {
              setService(s);
              setServiceOpen(false);
              setServiceQuery("");
              setCountry(null);
            }}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[#F8FAFC] text-left"
          >
            <span className="text-sm font-medium text-[#0F172A]">
              <HighlightedText text={s.name} query={serviceQuery} />
            </span>
            <span className="text-[11px] text-[#94A3B8] font-mono">{s.code}</span>
          </button>
        ))}
        {filteredServices.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-8">No services match</p>
        ) : null}
      </SearchSheet>

      <SearchSheet
        open={countryOpen}
        title="Select country"
        query={countryQuery}
        onQuery={setCountryQuery}
        onClose={() => setCountryOpen(false)}
        countLabel={`${filteredCountries.length} of ${liveCountries.length}`}
      >
        {filteredCountries.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => {
              setCountry(c);
              setCountryOpen(false);
              setCountryQuery("");
            }}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-[#F8FAFC] text-left"
          >
            <span className="text-sm font-medium text-[#0F172A]">
              {c.flag} <HighlightedText text={c.name} query={countryQuery} />
            </span>
            <span className="text-[11px] text-[#94A3B8]">{c.dial || c.code}</span>
          </button>
        ))}
        {filteredCountries.length === 0 ? (
          <p className="text-sm text-[#94A3B8] text-center py-8">No countries match</p>
        ) : null}
      </SearchSheet>
    </div>
  );
}
