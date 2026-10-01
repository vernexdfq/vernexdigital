"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  PhoneCall,
  MessageSquare,
  Clock,
  Plus,
  Search,
  ChevronRight,
  Info,
} from "lucide-react";
import WalletBalance from "@/components/WalletBalance";

type RentedNumber = {
  id: string;
  e164: string;
  label: string;
  country: string;
  flag: string;
  monthlyPrice: number;
};

type Country = {
  code: string;
  name: string;
  flag: string;
  dial: string;
  hasAreaCodes: boolean;
  monthlyPrice: number;
};

const COUNTRIES: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", dial: "+1", hasAreaCodes: true, monthlyPrice: 12500 },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1", hasAreaCodes: true, monthlyPrice: 11800 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "+44", hasAreaCodes: false, monthlyPrice: 9800 },
  { code: "FI", name: "Finland", flag: "🇫🇮", dial: "+358", hasAreaCodes: false, monthlyPrice: 8900 },
  { code: "IL", name: "Israel", flag: "🇮🇱", dial: "+972", hasAreaCodes: false, monthlyPrice: 11200 },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61", hasAreaCodes: false, monthlyPrice: 13200 },
  { code: "DE", name: "Germany", flag: "🇩🇪", dial: "+49", hasAreaCodes: false, monthlyPrice: 10200 },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", dial: "+31", hasAreaCodes: false, monthlyPrice: 9600 },
];

type AreaCode = { state: string; city: string; code: string };

const US_AREA_CODES: AreaCode[] = [
  { state: "California", city: "Los Angeles", code: "213" },
  { state: "California", city: "Los Angeles", code: "424" },
  { state: "New York", city: "New York", code: "212" },
  { state: "New York", city: "New York", code: "646" },
  { state: "Texas", city: "Houston", code: "713" },
  { state: "Texas", city: "Dallas", code: "214" },
  { state: "Florida", city: "Miami", code: "305" },
];

const CA_AREA_CODES: AreaCode[] = [
  { state: "Ontario", city: "Toronto", code: "416" },
  { state: "Ontario", city: "Ottawa", code: "613" },
  { state: "British Columbia", city: "Vancouver", code: "604" },
];

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Tab = "numbers" | "call" | "messages" | "history";
type BuyStep = "country" | "area" | "numbers" | null;

export default function RentNumberPage() {
  const [tab, setTab] = useState<Tab>("numbers");
  const [numbers, setNumbers] = useState<RentedNumber[]>([]);
  const [buyStep, setBuyStep] = useState<BuyStep>(null);
  const [countryQuery, setCountryQuery] = useState("");
  const [areaQuery, setAreaQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaCode | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<string[]>([]);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [renting, setRenting] = useState(false);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countryQuery]);

  const areaList = useMemo(() => {
    if (!selectedCountry) return [];
    if (selectedCountry.code === "US") return US_AREA_CODES;
    if (selectedCountry.code === "CA") return CA_AREA_CODES;
    return [];
  }, [selectedCountry]);

  const filteredAreas = useMemo(() => {
    const q = areaQuery.trim().toLowerCase();
    if (!q) return areaList;
    return areaList.filter(
      (a) =>
        a.state.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.code.includes(q)
    );
  }, [areaList, areaQuery]);

  function openBuy() {
    setBuyStep("country");
    setSelectedCountry(null);
    setSelectedArea(null);
    setAvailableNumbers([]);
    setCountryQuery("");
    setAreaQuery("");
  }

  function selectCountry(c: Country) {
    setSelectedCountry(c);
    setSelectedArea(null);
    setAvailableNumbers([]);
    if (c.hasAreaCodes) {
      setBuyStep("area");
      setAreaQuery("");
    } else {
      loadNumbersForCountry(c, null);
    }
  }

  function selectArea(a: AreaCode) {
    setSelectedArea(a);
    if (selectedCountry) loadNumbersForCountry(selectedCountry, a);
  }

  function loadNumbersForCountry(c: Country, area: AreaCode | null) {
    setBuyStep("numbers");
    setLoadingNumbers(true);
    setTimeout(() => {
      if (area) {
        const list = Array.from({ length: 6 }, () => {
          const mid = String(Math.floor(100 + Math.random() * 900));
          const last = String(Math.floor(1000 + Math.random() * 9000));
          return `+1 ${area.code} ${mid} ${last}`;
        });
        setAvailableNumbers(list);
      } else {
        setAvailableNumbers([
          `${c.dial} 500 100 200`,
          `${c.dial} 500 100 201`,
          `${c.dial} 500 100 202`,
        ]);
      }
      setLoadingNumbers(false);
    }, 500);
  }

  function rentNumber(e164: string) {
    if (!selectedCountry) return;
    setRenting(true);
    setTimeout(() => {
      const id = `num-${Date.now()}`;
      setNumbers((prev) => [
        {
          id,
          e164,
          label: "My Number",
          country: selectedCountry.name,
          flag: selectedCountry.flag,
          monthlyPrice: selectedCountry.monthlyPrice,
        },
        ...prev,
      ]);
      setRenting(false);
      setBuyStep(null);
      setTab("numbers");
    }, 600);
  }

  if (buyStep) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-28">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
          <div className="h-14 px-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (buyStep === "numbers" && selectedCountry?.hasAreaCodes) setBuyStep("area");
                else if (buyStep === "area" || buyStep === "numbers") {
                  setBuyStep("country");
                  setSelectedCountry(null);
                  setSelectedArea(null);
                } else setBuyStep(null);
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <h1 className="text-sm font-semibold text-[#0F172A]">
              {buyStep === "country" ? "Select Country" : "Choose a number"}
            </h1>
            <WalletBalance />
          </div>
        </header>
        <div className="px-4 pt-4">
          {buyStep === "country" && (
            <>
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  value={countryQuery}
                  onChange={(e) => setCountryQuery(e.target.value)}
                  placeholder="Search country..."
                  className="w-full h-11 pl-9 pr-3 rounded-[12px] border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:border-[#1877F2]"
                  autoFocus
                />
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden divide-y divide-[#E2E8F0]">
                {filteredCountries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCountry(c)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="text-xl">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A]">{c.name}</p>
                      <p className="text-[11px] text-[#94A3B8]">
                        Mobile · from {formatNaira(c.monthlyPrice)}/mo
                      </p>
                    </div>
                    <span className="text-sm text-[#64748B] tabular-nums">{c.dial}</span>
                    <ChevronRight size={16} className="text-[#CBD5E1]" />
                  </button>
                ))}
              </div>
            </>
          )}
          {buyStep === "area" && selectedCountry && (
            <>
              <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase mb-2">
                Select area code
              </p>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  value={areaQuery}
                  onChange={(e) => setAreaQuery(e.target.value)}
                  placeholder="Search state, city or code..."
                  className="w-full h-11 pl-9 pr-3 rounded-[12px] border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:border-[#1877F2]"
                  autoFocus
                />
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden divide-y divide-[#E2E8F0]">
                {filteredAreas.map((a) => (
                  <button
                    key={`${a.state}-${a.code}-${a.city}`}
                    type="button"
                    onClick={() => selectArea(a)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A]">{a.state}</p>
                      <p className="text-[11px] text-[#94A3B8]">
                        {a.city} ({a.code})
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#0F172A] tabular-nums">{a.code}</span>
                    <ChevronRight size={16} className="text-[#CBD5E1]" />
                  </button>
                ))}
              </div>
            </>
          )}
          {buyStep === "numbers" && selectedCountry && (
            <>
              <div className="rounded-[12px] bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-3 mb-4 flex gap-2.5">
                <Info size={16} className="text-[#1877F2] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#1E3A5F] leading-relaxed">
                  {formatNaira(selectedCountry.monthlyPrice)} / month · Voice & SMS · Pricing set in admin
                </p>
              </div>
              {loadingNumbers ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="w-8 h-8 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#64748B]">Finding available numbers…</p>
                </div>
              ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden divide-y divide-[#E2E8F0]">
                  {availableNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={renting}
                      onClick={() => rentNumber(num)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left disabled:opacity-60"
                    >
                      <span className="text-sm font-semibold text-[#0F172A] tabular-nums">{num}</span>
                      <span className="text-xs font-semibold text-[#1877F2]">Rent →</span>
                    </button>
                  ))}
                  {availableNumbers.length === 0 && (
                    <p className="text-center text-sm text-[#94A3B8] py-10">No numbers available</p>
                  )}
                </div>
              )}
              {renting && (
                <p className="text-center text-sm text-[#1877F2] mt-4 animate-pulse">Activating your number…</p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]">
            <ArrowLeft size={18} /> Back
          </Link>
          <h1 className="text-sm font-semibold text-[#0F172A]">Rent Number</h1>
          <WalletBalance />
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-[14px] bg-gradient-to-br from-[#0B1220] to-[#152238] p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[12px] bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <Phone size={22} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white leading-tight">Rent Number</p>
            <p className="text-[12px] text-slate-300 mt-0.5 leading-snug">
              Real phone numbers · Calls & SMS · Monthly billing
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(
            [
              { id: "numbers" as Tab, label: "My Numbers", icon: Phone },
              { id: "call" as Tab, label: "Make a Call", icon: PhoneCall },
              { id: "messages" as Tab, label: "Messages", icon: MessageSquare },
              { id: "history" as Tab, label: "History", icon: Clock },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 h-9 rounded-full text-xs font-semibold border transition ${
                  active
                    ? "bg-[#1877F2] text-white border-[#1877F2]"
                    : "bg-white text-[#64748B] border-[#E2E8F0]"
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "numbers" && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#64748B]">{numbers.length} numbers</p>
              <button
                type="button"
                onClick={openBuy}
                className="h-9 px-3.5 rounded-full bg-[#1877F2] text-white text-xs font-semibold flex items-center gap-1"
              >
                <Plus size={14} /> Get a Number
              </button>
            </div>
            {numbers.length === 0 ? (
              <div className="rounded-[16px] bg-white border border-[#E2E8F0] px-6 py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF]">
                  <Phone size={22} className="text-[#1877F2]" />
                </div>
                <p className="text-base font-semibold text-[#0F172A]">No numbers yet</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Get a real phone number to make calls and send SMS.
                </p>
                <button
                  type="button"
                  onClick={openBuy}
                  className="mt-5 h-11 px-5 rounded-full bg-[#1877F2] text-white text-sm font-semibold"
                >
                  Get your first number
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {numbers.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-[14px] bg-white border border-[#E2E8F0] px-4 py-3.5 flex items-center gap-3"
                  >
                    <span className="text-xl">{n.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] tabular-nums">{n.e164}</p>
                      <p className="text-[11px] text-[#94A3B8]">
                        {n.label} · {n.country} · {formatNaira(n.monthlyPrice)}/mo
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab !== "numbers" && (
          <div className="rounded-[16px] bg-white border border-[#E2E8F0] px-6 py-12 text-center">
            <p className="text-sm text-[#64748B]">
              {tab === "call" && "Calling will be available when you have a rented number."}
              {tab === "messages" && "SMS inbox will appear here after you rent a number."}
              {tab === "history" && "Call and SMS history will show here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
