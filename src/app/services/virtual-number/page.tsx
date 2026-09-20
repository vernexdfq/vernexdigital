"use client";

import { useMemo, useState } from "react";
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

type ProviderId =
  | "usa-s1"
  | "usa-s2"
  | "usa-s3"
  | "usa-s4"
  | "all-s1"
  | "all-s2"
  | "all-s3"
  | "all-s4";

const PROVIDERS: { id: ProviderId; label: string; flag: string; needsCountry: boolean }[] = [
  { id: "usa-s1", label: "USA (S1)", flag: "🇺🇸", needsCountry: false },
  { id: "usa-s2", label: "USA (S2)", flag: "🇺🇸", needsCountry: false },
  { id: "usa-s3", label: "USA (S3)", flag: "🇺🇸", needsCountry: false },
  { id: "usa-s4", label: "USA (S4)", flag: "🇺🇸", needsCountry: false },
  { id: "all-s1", label: "All Countries (S1)", flag: "🌐", needsCountry: true },
  { id: "all-s2", label: "All Countries (S2)", flag: "🌐", needsCountry: true },
  { id: "all-s3", label: "All Countries (S3)", flag: "🌐", needsCountry: true },
  { id: "all-s4", label: "All Countries (S4)", flag: "🌐", needsCountry: true },
];

const SERVICES = [
  "WhatsApp",
  "Facebook",
  "TikTok",
  "Telegram",
  "Instagram",
  "Google",
  "Twitter",
  "Discord",
  "Snapchat",
  "Amazon",
  "Microsoft",
  "Apple",
  "Uber",
  "PayPal",
  "Binance",
];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Germany",
  "Canada",
  "Nigeria",
  "France",
  "Netherlands",
  "India",
  "Brazil",
  "Australia",
  "Spain",
  "Italy",
  "Poland",
  "Ukraine",
  "South Africa",
];

// Mock prices by provider (demo until Verxor API wired)
const MOCK_PRICES: Record<ProviderId, number> = {
  "usa-s1": 5247.07,
  "usa-s2": 4800.0,
  "usa-s3": 1300.0,
  "usa-s4": 2100.5,
  "all-s1": 3446.31,
  "all-s2": 1115.5,
  "all-s3": 1850.0,
  "all-s4": 920.0,
};

const MOCK_STOCK: Record<ProviderId, number> = {
  "usa-s1": 1,
  "usa-s2": 45,
  "usa-s3": 803,
  "usa-s4": 120,
  "all-s1": 1391,
  "all-s2": 6647,
  "all-s3": 210,
  "all-s4": 88,
};

type Order = {
  phone: string;
  service: string;
  provider: string;
  status: "waiting" | "received" | "expired";
  code?: string;
};

const DEMO_ORDERS: Order[] = [
  {
    phone: "19289859379",
    service: "WhatsApp",
    provider: "USA (S4)",
    status: "waiting",
  },
  {
    phone: "523313479703",
    service: "WhatsApp",
    provider: "All Countries (S2)",
    status: "received",
    code: "482917",
  },
];

export default function VirtualNumberPage() {
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
  const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!;
  const needsCountry = selectedProvider.needsCountry;

  const filteredServices = useMemo(() => {
    const q = serviceQuery.toLowerCase();
    return SERVICES.filter((s) => s.toLowerCase().includes(q));
  }, [serviceQuery]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.toLowerCase();
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [countryQuery]);

  function selectProvider(id: ProviderId) {
    setProvider(id);
    setService("");
    setCountry("");
    setShowPrice(false);
    setError("");
    setActiveOrder(null);
  }

  function selectService(name: string) {
    setService(name);
    setServiceOpen(false);
    setServiceQuery("");
    setError("");
    if (!needsCountry || country) {
      setFetching(true);
      setShowPrice(false);
      setTimeout(() => {
        setFetching(false);
        setShowPrice(true);
      }, 600);
    }
  }

  function selectCountry(name: string) {
    setCountry(name);
    setCountryOpen(false);
    setCountryQuery("");
    setError("");
    if (service) {
      setFetching(true);
      setShowPrice(false);
      setTimeout(() => {
        setFetching(false);
        setShowPrice(true);
      }, 600);
    }
  }

  function handleOrder() {
    // Demo: insufficient balance simulation when balance is low
    const balance = 0.27;
    const price = MOCK_PRICES[provider];
    if (balance < price) {
      setError("Insufficient wallet balance.");
      return;
    }
    setError("");
    const newOrder: Order = {
      phone: String(Math.floor(10000000000 + Math.random() * 90000000000)),
      service,
      provider: selectedProvider.label,
      status: "waiting",
    };
    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
  }

  const price = MOCK_PRICES[provider];
  const stock = MOCK_STOCK[provider];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-1 -ml-1 text-[#64748B]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-base font-semibold text-[#0F172A]">Virtual Numbers</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#16A34A]">₦0.27</span>
          <button className="w-9 h-9 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#64748B]">
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

        {/* Provider chips — USA S1–S4 + All Countries S1–S4 only */}
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => {
            const active = provider === p.id;
            return (
              <button
                key={p.id}
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

        {/* Order card */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 space-y-3">
          <h3 className="text-sm font-semibold text-[#0F172A]">Order a Number</h3>

          {needsCountry && (
            <div>
              <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
                Country ({COUNTRIES.length} available)
              </p>
              <button
                onClick={() => {
                  setCountryOpen(true);
                  setServiceOpen(false);
                }}
                className="w-full h-11 px-3 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2 text-sm text-left"
              >
                <Globe size={16} className="text-[#64748B] shrink-0" />
                <span className={country ? "text-[#0F172A] font-medium" : "text-[#94A3B8]"}>
                  {country || "Search & select a country"}
                </span>
                <ChevronDown size={16} className="ml-auto text-[#94A3B8]" />
              </button>
            </div>
          )}

          <div>
            <p className="text-[11px] font-medium text-[#64748B] uppercase tracking-wide mb-1.5">
              Service ({SERVICES.length} available)
            </p>
            <button
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

          {fetching && (
            <div className="flex items-center gap-2 text-sm text-[#64748B] py-2">
              <span className="w-4 h-4 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
              Fetching price...
            </div>
          )}

          {showPrice && service && (!needsCountry || country) && !fetching && (
            <>
              <div className="flex items-end justify-between pt-1">
                <div>
                  <p className="text-2xl font-bold text-[#1877F2] tabular-nums">
                    ₦{price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {stock} numbers in stock
                  </p>
                </div>
                <span className="text-xs font-medium text-[#16A34A] bg-emerald-50 px-2.5 py-1 rounded-full">
                  Available
                </span>
              </div>

              <button
                onClick={handleOrder}
                className="w-full h-11 bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-medium rounded-[10px] flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingCart size={16} />
                Order Number
              </button>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-[10px] px-3 py-2.5">
                  <X size={16} className="shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {activeOrder && (
            <div className="mt-2 p-3 rounded-[10px] border border-[#1877F2]/30 bg-[#1877F2]/5">
              <p className="text-xs font-medium text-[#64748B] mb-1">Waiting for SMS</p>
              <p className="text-sm font-semibold text-[#0F172A] tabular-nums">
                +{activeOrder.phone}
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Use this number on {activeOrder.service}. OTP will appear here when received.
              </p>
              {activeOrder.code ? (
                <p className="mt-2 text-lg font-bold tracking-widest text-[#16A34A]">
                  {activeOrder.code}
                </p>
              ) : (
                <p className="mt-2 text-xs text-[#1877F2] animate-pulse">Listening for SMS…</p>
              )}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Recent Orders</h3>
            <button className="text-xs font-medium text-[#1877F2]">View All</button>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
            <div className="grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr] gap-2 px-3 py-2 bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#64748B]">
              <span>Phone</span>
              <span>Service</span>
              <span>Provider</span>
              <span>Status</span>
            </div>
            {orders.map((o) => (
              <button
                key={o.phone + o.service}
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
                      ? "text-[#16A34A] font-medium"
                      : o.status === "expired"
                        ? "text-red-500"
                        : "text-amber-600"
                  }
                >
                  {o.status === "received" ? o.code || "OK" : o.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Service picker modal */}
      {serviceOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-t-[16px] sm:rounded-[16px] max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-[#0F172A]">Select Service</h3>
              <button onClick={() => setServiceOpen(false)} className="p-1 text-[#64748B]">
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
              <p className="text-[11px] text-[#94A3B8] mt-2">
                {filteredServices.length} of {SERVICES.length} services
              </p>
            </div>
            <div className="overflow-y-auto px-2 pb-4">
              {filteredServices.map((s) => (
                <button
                  key={s}
                  onClick={() => selectService(s)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-[10px] text-sm text-left ${
                    service === s ? "bg-[#1877F2]/10 text-[#1877F2]" : "text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#CBD5E1]" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Country picker modal */}
      {countryOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full max-w-md bg-white rounded-t-[16px] sm:rounded-[16px] max-h-[75vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-semibold text-[#0F172A]">Select Country</h3>
              <button onClick={() => setCountryOpen(false)} className="p-1 text-[#64748B]">
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
                  placeholder="Search country..."
                  className="flex-1 text-sm outline-none bg-transparent"
                />
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-2">
                {filteredCountries.length} of {COUNTRIES.length} countries
              </p>
            </div>
            <div className="overflow-y-auto px-2 pb-4">
              {filteredCountries.map((c) => (
                <button
                  key={c}
                  onClick={() => selectCountry(c)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-[10px] text-sm text-left ${
                    country === c ? "bg-[#1877F2]/10 text-[#1877F2]" : "text-[#0F172A] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#CBD5E1]" />
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
