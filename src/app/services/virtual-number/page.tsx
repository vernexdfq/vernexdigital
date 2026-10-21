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

const ISO: Record<string, string> = {
  "United States": "US",
  "United Kingdom": "GB",
  Germany: "DE",
  Canada: "CA",
  Nigeria: "NG",
  France: "FR",
  Netherlands: "NL",
  India: "IN",
  Brazil: "BR",
  Australia: "AU",
  Spain: "ES",
  Italy: "IT",
  Poland: "PL",
  Ukraine: "UA",
  "South Africa": "ZA",
};

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
  status: "waiting" | "received" | "expired" | "cancelled";
  code?: string;
  id?: string;
};

function HighlightedText({ text, query }: { text: string; query: string }) {
  const { parts } = highlightMatch(text, query);
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <span
            key={i}
            className="text-[#1877F2] font-semibold underline decoration-[#1877F2]/50 underline-offset-2"
          >
            {p.t}
          </span>
        ) : (
          <span key={i}>{p.t}</span>
        ),
      )}
    </>
  );
}

/**
 * Rock-solid Primex-style search overlay.
 * - fixed inset-0 → never pushes page layout
 * - body scroll locked while open
 * - sheet is bottom-anchored with fixed max-height (dvh) so keyboard does not collapse content
 * - internal scroll only; parent form stays locked
 */
function SearchSheet({
  open,
  onClose,
  title,
  countLabel,
  query,
  onQuery,
  placeholder,
  loading,
  emptyText,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  countLabel: string;
  query: string;
  onQuery: (v: string) => void;
  placeholder: string;
  loading?: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const prevPos = document.body.style.position;
    document.body.style.overflow = "hidden";
    document.body.style.position = "relative";
    return () => {
      document.body.style.overflow = prev;
      document.body.style.position = prevPos;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop — click closes, never moves page */}
      <div
        className="absolute inset-0 bg-black/45 transition-opacity"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet: fixed height, independent of keyboard / page scroll */}
      <div
        className="relative w-full max-w-lg mx-auto bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{
          maxHeight: "min(72dvh, 540px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#E2E8F0]" />
        </div>

        <div className="flex items-center justify-between px-4 pt-1 pb-2 shrink-0">
          <h3 className="text-[15px] font-semibold text-[#0F172A]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] active:bg-[#E2E8F0]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 h-11 px-3 rounded-xl border-2 border-[#1877F2] bg-white">
            <Search size={16} className="text-[#94A3B8] shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-sm outline-none bg-transparent text-[#0F172A] placeholder:text-[#94A3B8]"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {query ? (
              <button
                type="button"
                onClick={() => onQuery("")}
                className="p-0.5 text-[#94A3B8]"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
          <p className="text-[11px] text-[#64748B] mt-1.5 tabular-nums">{countLabel}</p>
        </div>

        <div className="overflow-y-auto flex-1 overscroll-contain px-2 pb-6 min-h-0">
          {loading ? (
            <p className="px-3 py-12 text-sm text-center text-[#94A3B8]">Loading…</p>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

export default function VirtualNumberPage() {
  const { wallet } = useUser();
  const [provider, setProvider] = useState<ProviderId>("usa-s1");
  const [service, setService] = useState("");
  const [country, setCountry] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [fetching, setFetching] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [options, setOptions] = useState<PriceOption[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [ordering, setOrdering] = useState(false);
  const [liveServices, setLiveServices] = useState<CatalogService[]>([]);
  const [liveCountries, setLiveCountries] = useState<CatalogCountry[]>([]);
  const [svcCodes, setSvcCodes] = useState<Record<string, string>>({});
  const [ctrMeta, setCtrMeta] = useState<Record<string, { code: string; grizzly?: string }>>({});
  const [servicesLoading, setServicesLoading] = useState(true);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!;
  const needsCountry = selectedProvider.needsCountry;
  const balance = wallet?.balance ?? 0;
  const selected = options[selectedIdx] || null;

  const filteredServices = useMemo(() => {
    if (!serviceQuery.trim()) return liveServices;
    return liveServices.filter((s) => serviceMatchesQuery(s, serviceQuery));
  }, [serviceQuery, liveServices]);

  const filteredCountries = useMemo(() => {
    if (!countryQuery.trim()) return liveCountries;
    return liveCountries.filter((c) => countryMatchesQuery(c, countryQuery));
  }, [countryQuery, liveCountries]);

  const loadServices = useCallback(async (pool: ProviderId) => {
    setServicesLoading(true);
    try {
      const { services } = await fetchServices(pool);
      setLiveServices(services);
      const codes: Record<string, string> = {};
      services.forEach((s) => {
        codes[s.name] = s.code;
      });
      setSvcCodes(codes);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadServices(provider);
  }, [provider, loadServices]);

  // Restore recent orders from session so they survive refresh within the tab
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("vn_recent_orders");
      if (raw) {
        const parsed = JSON.parse(raw) as Order[];
        if (Array.isArray(parsed) && parsed.length) setOrders(parsed.slice(0, 8));
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (orders.length) sessionStorage.setItem("vn_recent_orders", JSON.stringify(orders.slice(0, 8)));
    } catch {}
  }, [orders]);

  function selectProvider(id: ProviderId) {
    setProvider(id);
    setService("");
    setCountry("");
    setShowPrice(false);
    setError("");
    setActiveOrder(null);
    setOptions([]);
    setSelectedIdx(0);
    setLiveCountries([]);
    setServiceQuery("");
    setCountryQuery("");
    setServiceOpen(false);
    setCountryOpen(false);
  }

  const loadPrice = useCallback(
    async (svc: string, ctry: string, pool: ProviderId) => {
      if (!svc) return;
      if (PROVIDERS.find((p) => p.id === pool)?.needsCountry && !ctry) return;
      setFetching(true);
      setShowPrice(false);
      setError("");
      setOptions([]);
      setSelectedIdx(0);
      try {
        const svcCode = svcCodes[svc] || svc;
        const ctryCode = ctry
          ? ctrMeta[ctry]?.grizzly || ctrMeta[ctry]?.code || ISO[ctry] || ctry
          : "";
        const qs = new URLSearchParams({ mode: "prices", pool, service: svcCode });
        if (ctryCode) qs.set("country", ctryCode);
        const res = await fetch(`/api/vn/catalog?${qs}`);
        const data = await res.json().catch(() => ({}));
        const raw = Array.isArray(data.options) ? data.options : [];
        if (data.ok && raw.length > 0) {
          const mapped: PriceOption[] = raw.map(
            (
              o: {
                label?: string;
                priceNgn?: number;
                wholesaleNgn?: number;
                costUsd?: number;
                stock?: number;
                grizzlyCountry?: string;
              },
              i: number,
            ) => ({
              label: o.label || `Route ${i + 1}`,
              priceNgn: Math.round(Number(o.priceNgn) || 0),
              wholesaleNgn: Math.round(Number(o.wholesaleNgn) || 0),
              costUsd: Number(o.costUsd) || 0,
              stock: Number(o.stock) || 0,
              grizzlyCountry: String(o.grizzlyCountry || ISO[ctry] || ctry || "US"),
            }),
          );
          mapped.sort((a, b) => a.priceNgn - b.priceNgn);
          setOptions(mapped);
          setSelectedIdx(0);
          setShowPrice(true);
        } else {
          setShowPrice(false);
          setError(
            data.error || "No numbers available for this selection. Try another tier or service.",
          );
        }
      } catch {
        setShowPrice(false);
        setError("Could not load live prices. Try again.");
      } finally {
        setFetching(false);
      }
    },
    [svcCodes, ctrMeta],
  );

  function selectService(name: string) {
    setService(name);
    setServiceOpen(false);
    setServiceQuery("");
    setError("");
    setCountry("");
    setCountryQuery("");
    if (needsCountry) {
      setCountriesLoading(true);
      const code = svcCodes[name] || name;
      void fetchCountries(provider, code).then((list) => {
        setLiveCountries(list);
        const meta: Record<string, { code: string; grizzly?: string }> = {};
        list.forEach((c) => {
          meta[c.name] = { code: c.code, grizzly: c.grizzlyCode || c.code };
        });
        setCtrMeta(meta);
        setCountriesLoading(false);
      });
    } else {
      void loadPrice(name, "United States", provider);
    }
  }

  function selectCountry(name: string) {
    setCountry(name);
    setCountryOpen(false);
    setCountryQuery("");
    setError("");
    if (service) {
      void loadPrice(service, name, provider);
    }
  }

  async function handleOrder() {
    if (!selected || selected.priceNgn < 50) {
      setError("Select a price route first.");
      return;
    }
    if (balance < selected.priceNgn) {
      setError("Insufficient wallet balance. Fund your wallet first.");
      return;
    }
    setOrdering(true);
    setError("");
    try {
      const { createBrowserClient } = await import("@/lib/supabase/client");
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Sign in again to buy a number.");
        setOrdering(false);
        return;
      }
      const res = await fetch("/api/vn/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          service: svcCodes[service] || service,
          country: selected.grizzlyCountry || "US",
          pool: provider,
          priceNgn: selected.priceNgn,
          wholesaleNgn: selected.wholesaleNgn,
          maxPriceUsd: selected.costUsd || 0.5,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || "Purchase failed");
        setOrdering(false);
        return;
      }
      const o = data.order;
      const order: Order = {
        phone: o.phone || "—",
        service,
        provider: selectedProvider.label,
        status: "waiting",
        id: o.id || o.providerOrderId,
      };
      setOrders((prev) => [order, ...prev].slice(0, 8));
      setActiveOrder(order);
      setShowPrice(false);
    } catch {
      setError("Network error while ordering");
    } finally {
      setOrdering(false);
    }
  }

  const serviceCountLabel = servicesLoading
    ? "Loading…"
    : serviceQuery.trim()
      ? `${filteredServices.length} of ${liveServices.length} services`
      : `${liveServices.length} of ${liveServices.length} services`;

  const countryCountLabel = countriesLoading
    ? "Loading…"
    : countryQuery.trim()
      ? `${filteredCountries.length} of ${liveCountries.length} countries`
      : `${liveCountries.length} of ${liveCountries.length} countries`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-1 -ml-1 text-[#64748B]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[15px] font-semibold text-[#0F172A]">Virtual Numbers</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#16A34A] tabular-nums">
            ₦{Number(balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
          <button
            type="button"
            className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B]"
          >
            <Bell size={18} />
          </button>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-5">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Virtual Numbers</h2>
          <p className="text-sm text-[#64748B] mt-1">
            Buy a temporary phone number to receive OTP codes
          </p>
        </div>

        {/* Provider pills */}
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProvider(p.id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  active
                    ? "bg-[#1877F2] text-white border-[#1877F2] shadow-sm"
                    : "bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#1877F2]/40"
                }`}
              >
                <span className="mr-1.5">{p.flag}</span>
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Order card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">Order a Number</h3>
            <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full">
              {selectedProvider.tier}
            </span>
          </div>

          {/* Service trigger */}
          <div>
            <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">
              Service ({servicesLoading ? "…" : liveServices.length} available)
            </p>
            <button
              type="button"
              onClick={() => {
                setServiceOpen(true);
                setCountryOpen(false);
                setError("");
              }}
              className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2.5 text-sm text-left"
            >
              <Phone size={16} className="text-[#94A3B8] shrink-0" />
              <span
                className={`flex-1 truncate ${
                  service ? "text-[#0F172A] font-medium" : "text-[#94A3B8]"
                }`}
              >
                {service || "Search & select a service"}
              </span>
              <ChevronDown size={16} className="text-[#94A3B8] shrink-0" />
            </button>
          </div>

          {/* Country trigger */}
          {needsCountry && (
            <div>
              <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1.5">
                Country ({countriesLoading ? "…" : liveCountries.length} available)
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!service) {
                    setError("Select a service first, then choose a country.");
                    return;
                  }
                  setCountryOpen(true);
                  setServiceOpen(false);
                  setError("");
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2.5 text-sm text-left"
              >
                <Globe size={16} className="text-[#94A3B8] shrink-0" />
                <span
                  className={`flex-1 truncate ${
                    country ? "text-[#0F172A] font-medium" : "text-[#94A3B8]"
                  }`}
                >
                  {country || (service ? "Search & select a country" : "Select a service first")}
                </span>
                <ChevronDown size={16} className="text-[#94A3B8] shrink-0" />
              </button>
            </div>
          )}

          {fetching && (
            <div className="flex items-center gap-2 text-sm text-[#64748B] py-1">
              <span className="w-4 h-4 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
              Fetching live prices…
            </div>
          )}

          {showPrice && options.length > 0 && !fetching && (
            <>
              <div>
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-2">
                  Available prices ({options.length})
                </p>
                <div className="space-y-2">
                  {options.map((opt, i) => {
                    const active = i === selectedIdx;
                    return (
                      <button
                        key={`${opt.label}-${opt.priceNgn}-${i}`}
                        type="button"
                        onClick={() => setSelectedIdx(i)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-colors ${
                          active
                            ? "border-[#1877F2] bg-[#1877F2]/5"
                            : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#1877F2]/40"
                        }`}
                      >
                        <div>
                          <p
                            className={`text-[15px] font-semibold tabular-nums ${
                              active ? "text-[#1877F2]" : "text-[#0F172A]"
                            }`}
                          >
                            ₦{opt.priceNgn.toLocaleString("en-NG")}
                          </p>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            {opt.label}
                            {opt.stock > 0
                              ? ` · ${opt.stock > 9999 ? "9k+" : opt.stock} in stock`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {opt.stock > 0 && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Available
                            </span>
                          )}
                          <span
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              active ? "border-[#1877F2]" : "border-[#CBD5E1]"
                            }`}
                          >
                            {active && <span className="w-2 h-2 rounded-full bg-[#1877F2]" />}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOrder}
                disabled={ordering || fetching || !selected}
                className="w-full h-12 bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <ShoppingCart size={17} />
                {ordering
                  ? "Ordering…"
                  : selected
                    ? `Order Number · ₦${selected.priceNgn.toLocaleString("en-NG")}`
                    : "Order Number"}
              </button>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              <X size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeOrder && (
            <div className="p-3.5 rounded-xl border border-[#1877F2]/25 bg-[#1877F2]/5">
              <p className="text-[11px] font-medium text-[#64748B] mb-1">Waiting for SMS</p>
              <p className="text-[15px] font-semibold text-[#0F172A] tabular-nums">
                {activeOrder.phone}
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Use this number on {activeOrder.service}. OTP will appear here when received.
              </p>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold text-[#0F172A]">Recent Orders</h3>
            <Link
              href="/services/virtual-number/orders"
              className="text-xs font-medium text-[#1877F2] flex items-center gap-0.5"
            >
              View all →
            </Link>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            {orders.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
                  <FileClock size={22} className="text-[#94A3B8]" />
                </div>
                <p className="text-sm font-medium text-[#0F172A]">No orders yet</p>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Your number purchases will show here
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr] gap-2 px-3 py-2.5 bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                  <span>Phone</span>
                  <span>Service</span>
                  <span>Provider</span>
                  <span>Status</span>
                </div>
                {orders.map((o) => (
                  <button
                    key={(o.id || "") + o.phone + o.service}
                    type="button"
                    onClick={() => setActiveOrder(o)}
                    className="w-full grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr] gap-2 px-3 py-3 border-t border-[#E2E8F0] text-left text-xs hover:bg-[#F8FAFC]"
                  >
                    <span className="font-medium text-[#1877F2] tabular-nums truncate">
                      {o.phone}
                    </span>
                    <span className="text-[#0F172A] truncate">{o.service}</span>
                    <span className="text-[#64748B] truncate">{o.provider}</span>
                    <span
                      className={
                        o.status === "received"
                          ? "text-emerald-600"
                          : o.status === "expired" || o.status === "cancelled"
                            ? "text-red-500"
                            : "text-amber-600"
                      }
                    >
                      {o.status}
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Service search sheet — zero layout shift */}
      <SearchSheet
        open={serviceOpen}
        onClose={() => {
          setServiceOpen(false);
          setServiceQuery("");
        }}
        title="Select Service"
        countLabel={serviceCountLabel}
        query={serviceQuery}
        onQuery={setServiceQuery}
        placeholder="Search service…"
        loading={servicesLoading}
        emptyText="No services match"
      >
        {filteredServices.length === 0 ? (
          <div className="px-3 py-12 text-center">
            <Search size={28} className="mx-auto text-[#CBD5E1] mb-2" />
            <p className="text-sm text-[#94A3B8]">No services match</p>
          </div>
        ) : (
          filteredServices.map((s) => (
            <button
              key={s.code + s.name}
              type="button"
              onClick={() => selectService(s.name)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left ${
                service === s.name
                  ? "bg-[#1877F2]/10 text-[#1877F2]"
                  : "text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <span className="flex-1 truncate">
                <HighlightedText text={s.name} query={serviceQuery} />
              </span>
              <span className="text-[11px] text-[#94A3B8] tabular-nums shrink-0 font-mono">
                {s.code}
              </span>
            </button>
          ))
        )}
      </SearchSheet>

      {/* Country search sheet — zero layout shift */}
      <SearchSheet
        open={countryOpen}
        onClose={() => {
          setCountryOpen(false);
          setCountryQuery("");
        }}
        title="Select Country"
        countLabel={countryCountLabel}
        query={countryQuery}
        onQuery={setCountryQuery}
        placeholder="Search UK, Nigeria, Germany…"
        loading={countriesLoading}
        emptyText="No countries match"
      >
        {filteredCountries.length === 0 ? (
          <div className="px-3 py-12 text-center">
            <Search size={28} className="mx-auto text-[#CBD5E1] mb-2" />
            <p className="text-sm text-[#94A3B8]">No countries match</p>
          </div>
        ) : (
          filteredCountries.map((c) => (
            <button
              key={c.code + c.name}
              type="button"
              onClick={() => selectCountry(c.name)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left ${
                country === c.name
                  ? "bg-[#1877F2]/10 text-[#1877F2]"
                  : "text-[#0F172A] hover:bg-[#F8FAFC]"
              }`}
            >
              <span className="text-base leading-none shrink-0">{c.flag || "🌍"}</span>
              <span className="flex-1 truncate">
                <HighlightedText text={c.name} query={countryQuery} />
              </span>
              <span className="text-[11px] text-[#94A3B8] tabular-nums shrink-0 font-mono">
                {c.code}
              </span>
            </button>
          ))
        )}
      </SearchSheet>
    </div>
  );
}
