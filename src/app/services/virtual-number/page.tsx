"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
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
import { loadVnPricing, vnCustomerPrice, type VnPricingConfig } from "@/lib/vn-panel-pricing";

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
  wholesaleNgn?: number;
  expiresAt?: number;
  cancelAvailableAt?: number;
  refunded?: boolean;
};

const OTP_TTL_MS = 20 * 60 * 1000;
const CANCEL_LOCK_MS = 5 * 60 * 1000;

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
  const router = useRouter();
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
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [vnPricing, setVnPricing] = useState<VnPricingConfig>(() => loadVnPricing());

  const needsCountry = PROVIDERS.find((p) => p.id === provider)?.needsCountry ?? false;
  const currentTier = PROVIDERS.find((p) => p.id === provider)?.tier ?? "Economy";

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("vn_recent_orders");
      if (raw) {
        const parsed = JSON.parse(raw) as Order[];
        if (Array.isArray(parsed) && parsed.length) setRecentOrders(parsed);
      }
    } catch {}
  }, []);

  /* live-sync the markup set from the admin Virtual Numbers page */
  useEffect(() => {
    const sync = () => setVnPricing(loadVnPricing());
    window.addEventListener("vernex-vn-pricing-updated", sync);
    return () => window.removeEventListener("vernex-vn-pricing-updated", sync);
  }, []);

  /* when the panel markup changes, reprice the loaded routes in place */
  useEffect(() => {
    setPrices((prev) =>
      prev.map((o) => ({
        ...o,
        priceNgn: vnCustomerPrice(o.wholesaleNgn || o.priceNgn, vnPricing),
      })),
    );
    setSelectedPrice((sel) =>
      sel
        ? { ...sel, priceNgn: vnCustomerPrice(sel.wholesaleNgn || sel.priceNgn, vnPricing) }
        : sel,
    );
  }, [vnPricing]);

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
          const opts: PriceOption[] = data.options.map((o: any, i: number) => {
            const wholesale = Number(o.wholesaleNgn) || 0;
            return {
              label: o.label || `Route ${i + 1}`,
              priceNgn: vnCustomerPrice(wholesale || Number(o.priceNgn) || 0, loadVnPricing()),
              wholesaleNgn: wholesale,
              costUsd: Number(o.costUsd) || 0,
              stock: Number(o.stock) || 0,
              grizzlyCountry: String(o.grizzlyCountry || country?.grizzlyCode || country?.code || "US"),
            };
          });
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

  function persist(list: Order[]) {
    try {
      sessionStorage.setItem("vn_recent_orders", JSON.stringify(list.slice(0, 30)));
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
      const providerOrderId = String(data.order?.providerOrderId || "");
      const order: Order = {
        id: String(data.order?.id || providerOrderId || `local_${now}`),
        phone: data.order?.phone || "",
        service: service.name,
        provider: "Grizzly",
        providerSlug: "grizzly",
        providerOrderId: providerOrderId || undefined,
        status: "waiting",
        priceNgn: selectedPrice.priceNgn,
        wholesaleNgn: selectedPrice.wholesaleNgn,
        expiresAt: now + OTP_TTL_MS,
        cancelAvailableAt: now + CANCEL_LOCK_MS,
      };
      setRecentOrders((prev) => {
        const next = [
          order,
          ...prev.filter((o) => o.providerOrderId !== providerOrderId),
        ].slice(0, 30);
        persist(next);
        return next;
      });
      void refresh();
      // Receive code on the orders page (stable list — no disappearing active card)
      router.push("/services/virtual-number/orders");
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

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
          <h2 className="text-[15px] font-semibold text-[#0F172A]">Order a Number</h2>

          <button
            type="button"
            onClick={() => setServiceOpen(true)}
            className="w-full h-12 px-3 rounded-xl border border-[#E2E8F0] flex items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-sm text-[#64748B]">
              <Search size={16} />
              {service ? (
                <span className="text-[#0F172A] font-medium">{service.name}</span>
              ) : (
                "Search & select a service (100 available)"
              )}
            </span>
            <ChevronDown size={16} className="text-[#94A3B8]" />
          </button>

          <button
            type="button"
            disabled={!service}
            onClick={() => service && setCountryOpen(true)}
            className="w-full h-12 px-3 rounded-xl border border-[#E2E8F0] flex items-center justify-between text-left disabled:opacity-50"
          >
            <span className="flex items-center gap-2 text-sm text-[#64748B]">
              <Globe size={16} />
              {country ? (
                <span className="text-[#0F172A] font-medium">
                  {country.flag} {country.name}
                </span>
              ) : needsCountry ? (
                service ? "Select a country" : "Select a service first"
              ) : (
                "USA (auto)"
              )}
            </span>
            <ChevronDown size={16} className="text-[#94A3B8]" />
          </button>

          {loadingPrices ? (
            <p className="text-sm text-[#94A3B8] text-center py-4">Loading routes…</p>
          ) : prices.length > 0 ? (
            <div className="space-y-2">
              {prices.map((opt) => (
                <button
                  key={opt.label + opt.priceNgn}
                  type="button"
                  onClick={() => setSelectedPrice(opt)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border transition ${
                    selectedPrice === opt
                      ? "border-[#1877F2] bg-[#EEF4FF]"
                      : "border-[#E2E8F0] bg-white"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#0F172A]">₦{opt.priceNgn.toLocaleString()}</p>
                    <p className="text-[11px] text-[#94A3B8]">{opt.label}</p>
                  </div>
                  <span className="text-[12px] font-medium text-[#16A34A]">
                    {opt.stock >= 1000 ? `${Math.floor(opt.stock / 1000)}k+` : opt.stock} in stock
                  </span>
                </button>
              ))}
            </div>
          ) : service ? (
            <p className="text-sm text-[#94A3B8] text-center py-3">No routes for this selection</p>
          ) : null}

          {buyError ? (
            <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
              {buyError}
            </div>
          ) : null}

          <button
            type="button"
            disabled={buying || !selectedPrice || !service}
            onClick={() => void handleBuy()}
            className="w-full h-12 rounded-xl bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShoppingCart size={18} />
            {buying ? "Ordering…" : "Order Number"}
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-semibold text-[#0F172A]">Recent Orders</h2>
            <Link href="/services/virtual-number/orders" className="text-sm text-[#1877F2] font-medium">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col items-center text-center">
              <FileClock className="text-[#CBD5E1] mb-2" size={32} />
              <p className="text-sm font-medium text-[#0F172A]">No orders yet</p>
              <p className="text-xs text-[#94A3B8] mt-1">Your number purchases will show here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.slice(0, 5).map((o, i) => (
                <Link
                  key={o.id || o.providerOrderId || i}
                  href="/services/virtual-number/orders"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-3 flex items-center justify-between text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A]">{o.service}</p>
                    <p className="text-xs text-[#1877F2] font-mono tabular-nums truncate">{o.phone}</p>
                    {o.status === "received" && o.code ? (
                      <p className="text-[12px] font-semibold text-emerald-700 mt-0.5 tracking-wider">
                        Code {o.code}
                      </p>
                    ) : o.status === "waiting" ? (
                      <p className="text-[11px] text-amber-600 mt-0.5">Waiting for SMS…</p>
                    ) : null}
                  </div>
                  <span
                    className={`text-[11px] font-semibold shrink-0 ${
                      o.status === "waiting"
                        ? "text-amber-600"
                        : o.status === "received"
                          ? "text-emerald-600"
                          : "text-[#64748B]"
                    }`}
                  >
                    {o.status === "waiting"
                      ? "Waiting"
                      : o.status === "received"
                        ? "Code ready"
                        : o.status}
                  </span>
                </Link>
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
