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
} from "lucide-react";
import { useUser } from "@/lib/useUser";
import {
  fetchServices,
  fetchCountries,
  countryMatchesQuery,
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

const PROVIDERS: { id: ProviderId; label: string; flag: string; needsCountry: boolean; tier: string }[] = [
  { id: "usa-s1", label: "USA (S1)", flag: "🇺🇸", needsCountry: false, tier: "Economy" },
  { id: "usa-s2", label: "USA (S2)", flag: "🇺🇸", needsCountry: false, tier: "Standard" },
  { id: "usa-s3", label: "USA (S3)", flag: "🇺🇸", needsCountry: false, tier: "Fast" },
  { id: "usa-s4", label: "USA (S4)", flag: "🇺🇸", needsCountry: false, tier: "Premium" },
  { id: "all-s1", label: "All Countries (S1)", flag: "🌐", needsCountry: true, tier: "Economy" },
  { id: "all-s2", label: "All Countries (S2)", flag: "🌐", needsCountry: true, tier: "Standard" },
  { id: "all-s3", label: "All Countries (S3)", flag: "🌐", needsCountry: true, tier: "Fast" },
  { id: "all-s4", label: "All Countries (S4)", flag: "🌐", needsCountry: true, tier: "Premium" },
];

const SERVICES = [
  "WhatsApp", "Facebook", "TikTok", "Telegram", "Instagram", "Google", "Twitter",
  "Discord", "Snapchat", "Amazon", "Microsoft", "Apple", "Uber", "PayPal", "Binance",
];

const ISO: Record<string, string> = {
  "United States": "US", "United Kingdom": "GB", Germany: "DE", Canada: "CA",
  Nigeria: "NG", France: "FR", Netherlands: "NL", India: "IN", Brazil: "BR",
  Australia: "AU", Spain: "ES", Italy: "IT", Poland: "PL", Ukraine: "UA", "South Africa": "ZA",
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
  status: "waiting" | "received" | "expired";
  code?: string;
};

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
  const [liveServices, setLiveServices] = useState<string[]>(SERVICES);
  const [liveCountries, setLiveCountries] = useState<CatalogCountry[]>([]);
  const [svcCodes, setSvcCodes] = useState<Record<string, string>>({});
  const [ctrMeta, setCtrMeta] = useState<Record<string, { code: string; grizzly?: string }>>({});
  const [servicesLoading, setServicesLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!;
  const needsCountry = selectedProvider.needsCountry;
  const balance = wallet.balance;
  const selected = options[selectedIdx] || null;

  const filteredServices = useMemo(() => {
    const q = serviceQuery.toLowerCase();
    return liveServices.filter((s) => s.toLowerCase().includes(q));
  }, [serviceQuery, liveServices]);

  const filteredCountries = useMemo(() => {
    return liveCountries.filter((c) => countryMatchesQuery(c, countryQuery));
  }, [countryQuery, liveCountries]);

  const loadServices = useCallback(async (pool: ProviderId) => {
    setServicesLoading(true);
    try {
      const { services } = await fetchServices(pool);
      setLiveServices(services.map((s) => s.name));
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
          setError(data.error || "No numbers available for this selection. Try another tier or service.");
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
      };
      setOrders((prev) => [order, ...prev]);
      setActiveOrder(order);
      setShowPrice(false);
    } catch {
      setError("Network error while ordering");
    } finally {
      setOrdering(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-1 -ml-1 text-[#64748B]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-base font-semibold text-[#0F172A]">Virtual Numbers</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#16A34A]">
            ₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
          <button type="button" className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
            <Bell size={18} />
          </button>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Virtual Numbers</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            Buy a temporary phone number to receive OTP codes
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProvider(p.id)}
                className={`px-3 py-2 rounded-[10px] text-xs font-medium border transition-colors ${
                  active
                    ? "bg-[#1877F2] text-white border-[#1877F2]"
                    : "bg-white text-[#0F172A] border-[#E2E8F0] hover:border-[#1877F2]/40"
                }`}
              >
                <span className="mr-1">{p.flag}</span>
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#0F172A]">Order a Number</h3>
            <span className="text-[10px] font-medium text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
              {selectedProvider.tier}
            </span>
          </div>

          <div>
            <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
              Service ({servicesLoading ? "…" : liveServices.length} available)
            </p>
            <button
              type="button"
              onClick={() => {
                setServiceOpen(true);
                setCountryOpen(false);
              }}
              className="w-full h-11 px-3 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2 text-sm text-left"
            >
              <Phone size={16} className="text-[#64748B] shrink-0" />
              <span className={service ? "text-[#0F172A] font-medium" : "text-[#94A3B8]"}>
                {service || "Search & select a service"}
              </span>
              <ChevronDown size={16} className="ml-auto text-[#94A3B8]" />
            </button>
          </div>

          {needsCountry && (
            <div>
              <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
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
                }}
                className="w-full h-11 px-3 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2 text-sm text-left"
              >
                <Globe size={16} className="text-[#64748B] shrink-0" />
                <span className={country ? "text-[#0F172A] font-medium" : "text-[#94A3B8]"}>
                  {country || (service ? "Search & select a country" : "Select a service first")}
                </span>
                <ChevronDown size={16} className="ml-auto text-[#94A3B8]" />
              </button>
            </div>
          )}

          {fetching && (
            <div className="flex items-center gap-2 text-sm text-[#64748B] py-2">
              <span className="w-4 h-4 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
              Fetching live prices…
            </div>
          )}

          {showPrice && options.length > 0 && !fetching && (
            <>
              <div>
                <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wide mb-2">
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
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] border text-left transition-colors ${
                          active
                            ? "border-[#1877F2] bg-[#1877F2]/5"
                            : "border-[#E2E8F0] bg-[#F8FAFC] hover:border-[#1877F2]/40"
                        }`}
                      >
                        <div>
                          <p
                            className={`text-sm font-semibold tabular-nums ${
                              active ? "text-[#1877F2]" : "text-[#0F172A]"
                            }`}
                          >
                            ₦{opt.priceNgn.toLocaleString("en-NG")}
                          </p>
                          <p className="text-[11px] text-[#64748B]">
                            {opt.label}
                            {opt.stock > 0 ? ` · stock ${opt.stock > 9999 ? "9k+" : opt.stock}` : ""}
                          </p>
                        </div>
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            active ? "border-[#1877F2]" : "border-[#CBD5E1]"
                          }`}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-[#1877F2]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleOrder}
                disabled={ordering || fetching || !selected}
                className="w-full h-11 bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-medium rounded-[10px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <ShoppingCart size={16} />
                {ordering
                  ? "Ordering…"
                  : selected
                    ? `Order Number · ₦${selected.priceNgn.toLocaleString("en-NG")}`
                    : "Order Number"}
              </button>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-[10px] px-3 py-2.5">
              <X size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {activeOrder && (
            <div className="mt-2 p-3 rounded-[10px] border border-[#1877F2]/30 bg-[#1877F2]/5">
              <p className="text-xs font-medium text-[#64748B] mb-1">Waiting for SMS</p>
              <p className="text-sm font-semibold text-[#0F172A] tabular-nums">{activeOrder.phone}</p>
              <p className="text-xs text-[#64748B] mt-1">
                Use this number on {activeOrder.service}. OTP will appear here when received.
              </p>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Recent Orders</h3>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
            {orders.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm text-[#64748B]">No orders yet</p>
                <p className="text-xs text-[#94A3B8] mt-1">Your number purchases will show here</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr] gap-2 px-3 py-2 bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
                  <span>Phone</span>
                  <span>Service</span>
                  <span>Provider</span>
                  <span>Status</span>
                </div>
                {orders.map((o) => (
                  <button
                    key={o.phone + o.service}
                    type="button"
                    onClick={() => setActiveOrder(o)}
                    className="w-full grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr] gap-2 px-3 py-3 border-t border-[#E2E8F0] text-left text-xs hover:bg-[#F8FAFC]"
                  >
                    <span className="font-medium text-[#1877F2] tabular-nums truncate">{o.phone}</span>
                    <span className="text-[#0F172A] truncate">{o.service}</span>
                    <span className="text-[#64748B] truncate">{o.provider}</span>
                    <span className="text-amber-600">{o.status}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {serviceOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-t-[16px] sm:rounded-[16px] max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Select Service · {liveServices.length}
              </h3>
              <button type="button" onClick={() => setServiceOpen(false)} className="p-1 text-[#64748B]">
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 h-11 px-3 rounded-[10px] border border-[#1877F2] bg-white">
                <Search size={16} className="text-[#64748B]" />
                <input
                  autoFocus
                  value={serviceQuery}
                  onChange={(e) => setServiceQuery(e.target.value)}
                  placeholder="Search service..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="overflow-y-auto px-2 pb-4">
              {filteredServices.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => selectService(s)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-[10px] text-sm text-left ${
                    service === s ? "bg-[#1877F2]/10 text-[#1877F2]" : "text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {countryOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-t-[16px] sm:rounded-[16px] max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-[#0F172A]">
                Select Country
                {countriesLoading
                  ? " · loading…"
                  : countryQuery.trim()
                    ? ` · ${filteredCountries.length} match`
                    : ` · ${liveCountries.length}`}
              </h3>
              <button type="button" onClick={() => setCountryOpen(false)} className="p-1 text-[#64748B]">
                <X size={18} />
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 h-11 px-3 rounded-[10px] border border-[#1877F2] bg-white">
                <Search size={16} className="text-[#64748B]" />
                <input
                  autoFocus
                  value={countryQuery}
                  onChange={(e) => setCountryQuery(e.target.value)}
                  placeholder="Search UK, Nigeria, Germany…"
                  className="flex-1 text-sm outline-none bg-transparent"
                />
              </div>
            </div>
            <div className="overflow-y-auto px-2 pb-4">
              {countriesLoading ? (
                <p className="px-3 py-6 text-sm text-center text-[#94A3B8]">Loading countries…</p>
              ) : filteredCountries.length === 0 ? (
                <p className="px-3 py-6 text-sm text-center text-[#94A3B8]">
                  No countries match. Try another search or service.
                </p>
              ) : (
                filteredCountries.map((c) => (
                  <button
                    key={c.code + c.name}
                    type="button"
                    onClick={() => selectCountry(c.name)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-[10px] text-sm text-left ${
                      country === c.name
                        ? "bg-[#1877F2]/10 text-[#1877F2]"
                        : "text-[#0F172A] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <span className="text-base leading-none">{c.flag || "🌍"}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    {c.dial ? (
                      <span className="text-[11px] text-[#94A3B8] tabular-nums">{c.dial}</span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
