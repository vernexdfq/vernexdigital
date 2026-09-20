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
  X,
  ChevronRight,
  Globe,
  RefreshCw,
  Pencil,
  Forward,
  Share2,
  Voicemail,
  Info,
} from "lucide-react";

type RentedNumber = {
  id: string;
  e164: string;
  label: string;
  country: string;
  flag: string;
  expires: string;
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
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷", dial: "+1", hasAreaCodes: true, monthlyPrice: 10500 },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61", hasAreaCodes: false, monthlyPrice: 13200 },
  { code: "DE", name: "Germany", flag: "🇩🇪", dial: "+49", hasAreaCodes: false, monthlyPrice: 10200 },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", dial: "+31", hasAreaCodes: false, monthlyPrice: 9600 },
  { code: "PL", name: "Poland", flag: "🇵🇱", dial: "+48", hasAreaCodes: false, monthlyPrice: 7800 },
  { code: "BR", name: "Brazil", flag: "🇧🇷", dial: "+55", hasAreaCodes: false, monthlyPrice: 8500 },
];

type AreaCode = { state: string; city: string; code: string };

const US_AREA_CODES: AreaCode[] = [
  { state: "Alabama", city: "Birmingham", code: "659" },
  { state: "Alabama", city: "Huntsville", code: "256" },
  { state: "Alabama", city: "Mobile", code: "251" },
  { state: "Alabama", city: "Montgomery", code: "334" },
  { state: "Arizona", city: "Phoenix", code: "520" },
  { state: "Arizona", city: "Phoenix", code: "623" },
  { state: "California", city: "Bakersfield", code: "661" },
  { state: "California", city: "Bakersfield", code: "805" },
  { state: "California", city: "Chino", code: "840" },
  { state: "California", city: "Fresno", code: "209" },
  { state: "California", city: "Fresno", code: "559" },
  { state: "California", city: "Long Beach", code: "657" },
  { state: "California", city: "Los Angeles", code: "213" },
  { state: "California", city: "Los Angeles", code: "424" },
  { state: "California", city: "Los Angeles", code: "562" },
  { state: "Connecticut", city: "New Haven", code: "475" },
  { state: "Florida", city: "Miami", code: "305" },
  { state: "New York", city: "New York", code: "212" },
  { state: "New York", city: "New York", code: "646" },
  { state: "Texas", city: "Houston", code: "713" },
  { state: "Texas", city: "Dallas", code: "214" },
];

const CA_AREA_CODES: AreaCode[] = [
  { state: "Alberta", city: "Peace River", code: "825" },
  { state: "Alberta", city: "Wetaskiwin", code: "587" },
  { state: "British Columbia", city: "Abbotsford", code: "604" },
  { state: "British Columbia", city: "Vancouver", code: "672" },
  { state: "British Columbia", city: "Merritt", code: "778" },
  { state: "Manitoba", city: "Brandon", code: "431" },
  { state: "Ontario", city: "Toronto", code: "416" },
  { state: "Ontario", city: "Ottawa", code: "613" },
];

const DEMO_NUMBERS_BY_COUNTRY: Record<string, string[]> = {
  FI: ["+358 41 400 3419", "+358 41 400 3499", "+358 41 400 3547", "+358 41 400 3565", "+358 41 400 3573", "+358 41 400 3593", "+358 41 400 3624", "+358 41 400 3634"],
  GB: ["+44 7700 900123", "+44 7700 900456", "+44 7700 900789"],
  IL: ["+972 50 123 4567", "+972 52 987 6543"],
  AU: ["+61 4 1234 5678", "+61 4 8765 4321"],
  DE: ["+49 151 12345678", "+49 160 98765432"],
  NL: ["+31 6 12345678", "+31 6 87654321"],
  PL: ["+48 512 345 678", "+48 600 123 456"],
  BR: ["+55 11 91234 5678", "+55 21 99876 5432"],
};

const WALLET = 0.27;

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type Tab = "numbers" | "call" | "messages" | "history";
type BuyStep = "country" | "area" | "numbers" | null;

export default function RentNumberPage() {
  const [tab, setTab] = useState<Tab>("numbers");
  const [numbers, setNumbers] = useState<RentedNumber[]>([]);
  const [selectedNumberId, setSelectedNumberId] = useState<string | null>(null);
  const [buyStep, setBuyStep] = useState<BuyStep>(null);
  const [countryQuery, setCountryQuery] = useState("");
  const [areaQuery, setAreaQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedArea, setSelectedArea] = useState<AreaCode | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<string[]>([]);
  const [loadingNumbers, setLoadingNumbers] = useState(false);
  const [renting, setRenting] = useState(false);
  const [callFromId, setCallFromId] = useState<string | null>(null);
  const [callTo, setCallTo] = useState("");
  const [msgFromId, setMsgFromId] = useState<string | null>(null);
  const [histFromId, setHistFromId] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<
    "main" | "rename" | "renew" | "forwarding" | "transfer" | "voicemail" | null
  >(null);
  const [renameValue, setRenameValue] = useState("");
  const [forwardSmsEmail, setForwardSmsEmail] = useState(false);
  const [forwardSmsMobile, setForwardSmsMobile] = useState(false);
  const [forwardCall, setForwardCall] = useState(false);
  const [voicemailOn, setVoicemailOn] = useState(false);

  const selectedNumber = numbers.find((n) => n.id === selectedNumberId) ?? null;

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q)
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
      (a) => a.state.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.code.includes(q)
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
        const list = Array.from({ length: 8 }, () => {
          const mid = String(Math.floor(100 + Math.random() * 900));
          const last = String(Math.floor(1000 + Math.random() * 9000));
          return `+1 ${area.code} ${mid} ${last}`;
        });
        setAvailableNumbers(list);
      } else {
        setAvailableNumbers(
          DEMO_NUMBERS_BY_COUNTRY[c.code] ?? [`${c.dial} 500 100 200`, `${c.dial} 500 100 201`, `${c.dial} 500 100 202`]
        );
      }
      setLoadingNumbers(false);
    }, 700);
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
          expires: "08 Oct 2027",
          monthlyPrice: selectedCountry.monthlyPrice,
        },
        ...prev,
      ]);
      setRenting(false);
      setBuyStep(null);
      setTab("numbers");
      setSelectedNumberId(id);
      setDetailView("main");
    }, 900);
  }

  function saveRename() {
    if (!selectedNumberId || !renameValue.trim()) return;
    setNumbers((prev) =>
      prev.map((n) => (n.id === selectedNumberId ? { ...n, label: renameValue.trim() } : n))
    );
    setDetailView("main");
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
            <button type="button" onClick={() => setBuyStep(null)} className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="px-4 pt-4">
          {buyStep === "country" && (
            <>
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} placeholder="Search country..." className="w-full h-11 pl-9 pr-3 rounded-[12px] border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15" autoFocus />
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden divide-y divide-[#E2E8F0]">
                {filteredCountries.map((c) => (
                  <button key={c.code} type="button" onClick={() => selectCountry(c)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#F8FAFC]">
                    <span className="text-xl">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A]">{c.name}</p>
                      <p className="text-[11px] text-[#94A3B8]">Mobile · from {formatNaira(c.monthlyPrice)}/mo</p>
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
              <div className="flex items-center justify-between rounded-[12px] bg-white border border-[#E2E8F0] px-3.5 py-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <div>
                    <p className="text-sm font-medium text-[#0F172A]">{selectedCountry.name}</p>
                    <p className="text-[11px] text-[#94A3B8]">Mobile</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setBuyStep("country"); setSelectedCountry(null); }} className="text-xs font-semibold text-[#1877F2]">Change</button>
              </div>
              <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase mb-2">Select area code</p>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input value={areaQuery} onChange={(e) => setAreaQuery(e.target.value)} placeholder="Search state, city or code..." className="w-full h-11 pl-9 pr-3 rounded-[12px] border border-[#E2E8F0] bg-white text-sm focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15" autoFocus />
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden divide-y divide-[#E2E8F0] max-h-[60vh] overflow-y-auto">
                {filteredAreas.map((a) => (
                  <button key={`${a.state}-${a.code}-${a.city}`} type="button" onClick={() => selectArea(a)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#F8FAFC]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A]">{a.state}</p>
                      <p className="text-[11px] text-[#94A3B8]">{a.city} ({a.code})</p>
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
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between rounded-[12px] bg-white border border-[#E2E8F0] px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{selectedCountry.flag}</span>
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{selectedCountry.name}</p>
                      <p className="text-[11px] text-[#94A3B8]">Mobile</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setBuyStep("country"); setSelectedCountry(null); setSelectedArea(null); }} className="text-xs font-semibold text-[#1877F2]">Change</button>
                </div>
                {selectedArea && (
                  <div className="flex items-center justify-between rounded-[12px] bg-white border border-[#E2E8F0] px-3.5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Globe size={18} className="text-[#1877F2]" />
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">{selectedArea.state} — {selectedArea.code}</p>
                        <p className="text-[11px] text-[#94A3B8]">{selectedArea.city}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setBuyStep("area"); setSelectedArea(null); setAvailableNumbers([]); }} className="text-xs font-semibold text-[#1877F2]">Change</button>
                  </div>
                )}
              </div>
              <div className="rounded-[12px] bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-3 mb-4 flex gap-2.5">
                <Info size={16} className="text-[#1877F2] shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#1E3A5F] leading-relaxed">{formatNaira(selectedCountry.monthlyPrice)} / month · Voice & SMS included · 30-day billing. Price is set in admin.</p>
              </div>
              {loadingNumbers ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span className="w-8 h-8 border-2 border-[#1877F2] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-[#64748B]">Finding available numbers…</p>
                </div>
              ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden divide-y divide-[#E2E8F0]">
                  {availableNumbers.map((num) => (
                    <button key={num} type="button" disabled={renting} onClick={() => rentNumber(num)} className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-[#F8FAFC] disabled:opacity-60">
                      <span className="text-sm font-semibold text-[#0F172A] tabular-nums">{num}</span>
                      <span className="text-xs font-semibold text-[#1877F2]">Rent →</span>
                    </button>
                  ))}
                  {availableNumbers.length === 0 && <p className="text-center text-sm text-[#94A3B8] py-10">No numbers available</p>}
                </div>
              )}
              {renting && <p className="text-center text-sm text-[#1877F2] mt-4 animate-pulse">Activating your number…</p>}
            </>
          )}
        </div>
      </div>
    );
  }

  if (selectedNumber && detailView) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-28">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
          <div className="h-14 px-4 flex items-center justify-between">
            <button type="button" onClick={() => { if (detailView === "main") { setSelectedNumberId(null); setDetailView(null); } else setDetailView("main"); }} className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]">
              <ArrowLeft size={18} /> Back
            </button>
            <h1 className="text-sm font-semibold text-[#0F172A]">
              {detailView === "main" && "Number details"}
              {detailView === "rename" && "Rename profile"}
              {detailView === "renew" && "Renew"}
              {detailView === "forwarding" && "Forwarding"}
              {detailView === "transfer" && "Transfer number"}
              {detailView === "voicemail" && "Voicemail settings"}
            </h1>
            <span className="w-8" />
          </div>
        </header>
        <div className="px-4 pt-4 space-y-4">
          {detailView === "main" && (
            <>
              <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{selectedNumber.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-[#0F172A] tabular-nums">{selectedNumber.e164}</p>
                    <p className="text-sm text-[#64748B] mt-0.5">{selectedNumber.label}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-1">Expires {selectedNumber.expires} · {formatNaira(selectedNumber.monthlyPrice)}/mo</p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden divide-y divide-[#E2E8F0]">
                <button type="button" onClick={() => { setRenameValue(selectedNumber.label); setDetailView("rename"); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#F8FAFC]">
                  <Pencil size={18} className="text-[#64748B]" /><span className="flex-1 text-sm font-medium text-[#0F172A]">Rename profile</span><ChevronRight size={16} className="text-[#CBD5E1]" />
                </button>
                <button type="button" onClick={() => setDetailView("renew")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#F8FAFC]">
                  <RefreshCw size={18} className="text-[#64748B]" /><span className="flex-1 text-sm font-medium text-[#0F172A]">Renew</span><ChevronRight size={16} className="text-[#CBD5E1]" />
                </button>
                <button type="button" onClick={() => setDetailView("voicemail")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#F8FAFC]">
                  <Voicemail size={18} className="text-[#64748B]" /><span className="flex-1 text-sm font-medium text-[#0F172A]">Voicemail settings</span><ChevronRight size={16} className="text-[#CBD5E1]" />
                </button>
                <button type="button" onClick={() => setDetailView("forwarding")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#F8FAFC]">
                  <Forward size={18} className="text-[#64748B]" /><span className="flex-1 text-sm font-medium text-[#0F172A]">Forwarding</span><ChevronRight size={16} className="text-[#CBD5E1]" />
                </button>
                <button type="button" onClick={() => setDetailView("transfer")} className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#F8FAFC]">
                  <Share2 size={18} className="text-[#64748B]" /><span className="flex-1 text-sm font-medium text-[#0F172A]">Transfer number</span><ChevronRight size={16} className="text-[#CBD5E1]" />
                </button>
              </div>
            </>
          )}
          {detailView === "rename" && (
            <div className="space-y-4">
              <p className="text-sm text-[#64748B]">Edit profile name</p>
              <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15" autoFocus />
              <button type="button" onClick={saveRename} className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold">Save</button>
            </div>
          )}
          {detailView === "renew" && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Duration</label>
                <div className="mt-1.5 h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] flex items-center justify-between text-sm"><span>12 Months</span><span className="text-[#94A3B8] text-xs">▼</span></div>
                <p className="mt-1.5 text-[12px] text-[#94A3B8]">How long do you want to keep this number.</p>
              </div>
              <div className="rounded-[12px] bg-white border border-[#E2E8F0] px-4 py-3 flex justify-between text-sm">
                <span className="text-[#64748B]">Estimated total</span>
                <span className="font-semibold text-[#0F172A] tabular-nums">{formatNaira(selectedNumber.monthlyPrice * 12)}</span>
              </div>
              <button type="button" className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold">Renew</button>
            </div>
          )}
          {detailView === "voicemail" && (
            <div className="bg-white border border-[#E2E8F0] rounded-[14px] px-4 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#0F172A]">Voicemail</span>
              <button type="button" onClick={() => setVoicemailOn((v) => !v)} className={`w-11 h-6 rounded-full transition-colors ${voicemailOn ? "bg-[#1877F2]" : "bg-[#E2E8F0]"}`}>
                <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${voicemailOn ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          )}
          {detailView === "forwarding" && (
            <div className="space-y-3">
              <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden divide-y divide-[#E2E8F0]">
                {[
                  { label: "SMS to e-mail", value: forwardSmsEmail, set: setForwardSmsEmail },
                  { label: "SMS to mobile number", value: forwardSmsMobile, set: setForwardSmsMobile },
                  { label: "Call to phone number", value: forwardCall, set: setForwardCall },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-4 py-3.5">
                    <span className="text-sm font-medium text-[#0F172A]">{item.label}</span>
                    <button type="button" onClick={() => item.set((v: boolean) => !v)} className={`w-11 h-6 rounded-full transition-colors ${item.value ? "bg-[#1877F2]" : "bg-[#E2E8F0]"}`}>
                      <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${item.value ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-[#94A3B8] px-1">Forwarded calls and SMS will be charged at normal rates.</p>
            </div>
          )}
          {detailView === "transfer" && (
            <div className="space-y-4">
              <p className="text-sm text-[#64748B] text-center leading-relaxed">Transfer this virtual phone number to another Vernex contact.</p>
              <div className="rounded-[12px] bg-white border border-[#E2E8F0] px-4 py-3 flex items-center gap-3">
                <span className="text-xl">{selectedNumber.flag}</span>
                <div>
                  <p className="text-sm font-medium text-[#0F172A]">{selectedNumber.label}</p>
                  <p className="text-xs text-[#64748B] tabular-nums">{selectedNumber.e164}</p>
                </div>
              </div>
              <button type="button" className="w-full h-12 rounded-[12px] border border-[#E2E8F0] bg-white text-sm font-semibold text-[#1877F2]">Select contact</button>
              <button type="button" className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold opacity-50" disabled>Transfer</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Phone }[] = [
    { id: "numbers", label: "My Numbers", icon: Phone },
    { id: "call", label: "Make a Call", icon: PhoneCall },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "history", label: "Call History", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]">
            <ArrowLeft size={18} /> Back
          </Link>
          <h1 className="text-sm font-semibold text-[#0F172A]">Rent Number</h1>
          <span className="text-sm font-semibold text-[#16A34A] tabular-nums">{formatNaira(WALLET)}</span>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-[14px] bg-gradient-to-br from-[#0B1220] to-[#152238] p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[12px] bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <PhoneCall size={22} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white leading-tight">Rent Number</p>
            <p className="text-[12px] text-slate-300 mt-0.5 leading-snug">Real phone numbers · Calls & SMS · Monthly billing</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold transition-colors ${active ? "bg-[#1877F2] text-white" : "bg-white text-[#64748B] border border-[#E2E8F0]"}`}>
                <Icon size={14} strokeWidth={2} />{t.label}
              </button>
            );
          })}
        </div>

        {tab === "numbers" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#64748B]">{numbers.length} number{numbers.length === 1 ? "" : "s"}</p>
              <button type="button" onClick={openBuy} className="flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-[#1877F2] text-white text-xs font-semibold">
                <Plus size={14} strokeWidth={2.5} /> Get a Number
              </button>
            </div>
            {numbers.length === 0 ? (
              <div className="rounded-[14px] bg-white border border-[#E2E8F0] py-14 px-6 text-center">
                <div className="w-14 h-14 mx-auto rounded-[14px] bg-[#EFF6FF] flex items-center justify-center mb-4">
                  <Phone size={28} className="text-[#1877F2]" strokeWidth={1.6} />
                </div>
                <p className="text-base font-semibold text-[#0F172A]">No numbers yet</p>
                <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed max-w-[260px] mx-auto">Get a real phone number to make calls and send SMS.</p>
                <button type="button" onClick={openBuy} className="mt-5 h-11 px-6 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold">Get your first number</button>
              </div>
            ) : (
              <div className="space-y-2">
                {numbers.map((n) => (
                  <button key={n.id} type="button" onClick={() => { setSelectedNumberId(n.id); setDetailView("main"); }} className="w-full rounded-[14px] bg-white border border-[#E2E8F0] px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition">
                    <span className="text-xl">{n.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] tabular-nums truncate">{n.e164}</p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">{n.label} · Expires {n.expires}</p>
                    </div>
                    <ChevronRight size={16} className="text-[#CBD5E1] shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "call" && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Call from</label>
              <button type="button" onClick={() => { if (numbers.length === 0) return; const idx = numbers.findIndex((n) => n.id === callFromId); setCallFromId(numbers[(idx + 1) % numbers.length]?.id ?? null); }} className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] flex items-center justify-between text-left">
                <span className={`text-sm ${callFromId ? "text-[#0F172A] font-medium tabular-nums" : "text-[#94A3B8]"}`}>{callFromId ? numbers.find((n) => n.id === callFromId)?.e164 : "Select your number…"}</span>
                <span className="text-[#94A3B8] text-xs">▼</span>
              </button>
              {numbers.length === 0 && (
                <p className="mt-1.5 text-[12px] text-[#64748B]">You need a <button type="button" onClick={openBuy} className="text-[#1877F2] font-medium">rented number</button> first.</p>
              )}
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Call to</label>
              <input value={callTo} onChange={(e) => setCallTo(e.target.value)} placeholder="+1 555 000 0000" className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15 tabular-nums" />
            </div>
            <div className="rounded-[12px] bg-white border border-[#E2E8F0] px-4 py-3 flex justify-between text-sm">
              <span className="text-[#64748B]">Pricing</span>
              <span className="font-medium text-[#0F172A]">From ₦45 / min</span>
            </div>
            <button type="button" disabled={!callFromId || callTo.trim().length < 6} className="w-full h-12 rounded-[12px] bg-[#16A34A] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
              <PhoneCall size={18} /> Call
            </button>
          </div>
        )}

        {tab === "messages" && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Select number</label>
              <button type="button" onClick={() => { if (numbers.length === 0) return; const idx = numbers.findIndex((n) => n.id === msgFromId); setMsgFromId(numbers[(idx + 1) % numbers.length]?.id ?? null); }} className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] flex items-center justify-between text-left">
                <span className={`text-sm ${msgFromId ? "text-[#0F172A] font-medium tabular-nums" : "text-[#94A3B8]"}`}>{msgFromId ? numbers.find((n) => n.id === msgFromId)?.e164 : "Select your number…"}</span>
                <span className="text-[#94A3B8] text-xs">▼</span>
              </button>
            </div>
            <button type="button" disabled={!msgFromId} className="w-full h-11 rounded-[12px] border border-[#1877F2] text-[#1877F2] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
              <Plus size={16} /> New Message
            </button>
            <div className="rounded-[14px] bg-white border border-[#E2E8F0] py-14 text-center">
              <MessageSquare size={28} className="mx-auto text-[#CBD5E1]" />
              <p className="mt-3 text-sm text-[#94A3B8">{msgFromId ? "No conversations yet" : "Select one of your numbers to see conversations"}</p>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Select a number</label>
              <button type="button" onClick={() => { if (numbers.length === 0) return; const idx = numbers.findIndex((n) => n.id === histFromId); setHistFromId(numbers[(idx + 1) % numbers.length]?.id ?? null); }} className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] flex items-center justify-between text-left">
                <span className={`text-sm ${histFromId ? "text-[#0F172A] font-medium tabular-nums" : "text-[#94A3B8]"}`}>{histFromId ? numbers.find((n) => n.id === histFromId)?.e164 : "Select a number…"}</span>
                <span className="text-[#94A3B8] text-xs">▼</span>
              </button>
            </div>
            <div className="rounded-[14px] bg-white border border-[#E2E8F0] py-14 text-center">
              <Clock size={28} className="mx-auto text-[#CBD5E1]" />
              <p className="mt-3 text-sm text-[#94A3B8]">{histFromId ? "No call history yet" : "Select a number to view call history"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
