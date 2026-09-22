"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  X,
  CheckCircle2,
  ChevronRight,
  Clock,
  Building2,
} from "lucide-react";

type CardType = "code" | "physical" | "tag" | "email";

type GiftCard = {
  id: string;
  name: string;
  color: string;
  bg: string;
  logoUrl: string;
  countries: string[];
  types: CardType[];
  ratePerDollar: number;
  minAmount: number;
  maxAmount: number;
  needsCode?: boolean;
  needsCvv?: boolean;
  needsExpiry?: boolean;
};

const GIFT_CARDS: GiftCard[] = [
  { id: "steam", name: "Steam", color: "#1B2838", bg: "#E8EEF5", logoUrl: "https://logo.clearbit.com/steampowered.com", countries: ["US", "UK", "EUR", "CAD", "AUD"], types: ["code"], ratePerDollar: 1050, minAmount: 5, maxAmount: 500, needsCode: true },
  { id: "apple", name: "Apple (iTunes)", color: "#000000", bg: "#F5F5F5", logoUrl: "https://logo.clearbit.com/apple.com", countries: ["US", "UK", "EUR", "CAD", "AUD"], types: ["code", "physical"], ratePerDollar: 1080, minAmount: 10, maxAmount: 500, needsCode: true, needsCvv: true, needsExpiry: true },
  { id: "google", name: "Google Play", color: "#34A853", bg: "#E8F5E9", logoUrl: "https://logo.clearbit.com/play.google.com", countries: ["US", "UK", "EUR", "CAD"], types: ["code"], ratePerDollar: 1020, minAmount: 5, maxAmount: 200, needsCode: true },
  { id: "amazon", name: "Amazon", color: "#FF9900", bg: "#FFF8E7", logoUrl: "https://logo.clearbit.com/amazon.com", countries: ["US", "UK", "EUR", "CAD", "AUD"], types: ["code", "physical"], ratePerDollar: 1040, minAmount: 10, maxAmount: 500, needsCode: true },
  { id: "razer", name: "Razer Gold", color: "#44D62C", bg: "#E8FBE8", logoUrl: "https://logo.clearbit.com/razer.com", countries: ["US", "UK", "EUR", "CAD"], types: ["code"], ratePerDollar: 980, minAmount: 5, maxAmount: 200, needsCode: true },
  { id: "xbox", name: "Xbox", color: "#107C10", bg: "#E8F5E9", logoUrl: "https://logo.clearbit.com/xbox.com", countries: ["US", "UK", "EUR", "CAD"], types: ["code"], ratePerDollar: 1010, minAmount: 10, maxAmount: 200, needsCode: true },
  { id: "ebay", name: "eBay", color: "#E53238", bg: "#FFEBEE", logoUrl: "https://logo.clearbit.com/ebay.com", countries: ["US", "UK", "EUR"], types: ["code"], ratePerDollar: 990, minAmount: 10, maxAmount: 300, needsCode: true },
  { id: "chime", name: "Chime", color: "#1EC677", bg: "#E6F9F0", logoUrl: "https://logo.clearbit.com/chime.com", countries: ["US"], types: ["tag", "email"], ratePerDollar: 1055, minAmount: 20, maxAmount: 1000 },
  { id: "vanilla", name: "Vanilla", color: "#E31837", bg: "#FFEBEE", logoUrl: "https://logo.clearbit.com/vanillagift.com", countries: ["US"], types: ["physical", "code"], ratePerDollar: 920, minAmount: 10, maxAmount: 500, needsCode: true, needsCvv: true, needsExpiry: true },
  { id: "visa", name: "Visa Gift", color: "#1A1F71", bg: "#E8EAF6", logoUrl: "https://logo.clearbit.com/visa.com", countries: ["US", "UK", "CAD"], types: ["physical", "code"], ratePerDollar: 950, minAmount: 25, maxAmount: 500, needsCode: true, needsCvv: true, needsExpiry: true },
];

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "EUR", name: "Eurozone", flag: "🇪🇺" },
  { code: "CAD", name: "Canada", flag: "🇨🇦" },
  { code: "AUD", name: "Australia", flag: "🇦🇺" },
];

const BANKS = [
  "Access Bank", "GTBank", "Zenith Bank", "First Bank", "UBA", "Kuda", "Opay",
  "Palmpay", "Moniepoint", "Fidelity Bank", "Stanbic IBTC", "Union Bank", "Wema Bank", "FCMB", "Other",
];

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function CardLogo({ card, size = "md" }: { card: GiftCard; size?: "sm" | "md" }) {
  const [failed, setFailed] = useState(false);
  const dim = size === "sm" ? "w-9 h-9" : "w-11 h-11";
  const initial = card.name.charAt(0).toUpperCase();
  if (failed) {
    return (
      <div className={`${dim} rounded-[10px] flex items-center justify-center font-bold text-sm shrink-0`} style={{ backgroundColor: card.bg, color: card.color }}>
        {initial}
      </div>
    );
  }
  return (
    <div className={`${dim} rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden border border-[#E2E8F0] bg-white`}>
      <img src={card.logoUrl} alt={card.name} className="w-full h-full object-contain p-1.5" onError={() => setFailed(true)} />
    </div>
  );
}

type Step = "list" | "form" | "review";

export default function GiftCardPage() {
  const [step, setStep] = useState<Step>("list");
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [cardType, setCardType] = useState<CardType | null>(null);
  const [code, setCode] = useState("");
  const [cvv, setCvv] = useState("");
  const [expiry, setExpiry] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankOpen, setBankOpen] = useState(false);
  const [orders, setOrders] = useState<{ id: string; card: string; amount: number; settlement: number; status: string; country: string }[]>([]);
  const [success, setSuccess] = useState(false);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return GIFT_CARDS;
    return GIFT_CARDS.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  const numericAmount = Number(amount) || 0;
  const settlement = selectedCard && numericAmount > 0 ? Math.round(selectedCard.ratePerDollar * numericAmount) : 0;

  const canContinueForm =
    !!selectedCard &&
    !!country &&
    numericAmount >= (selectedCard?.minAmount ?? 0) &&
    numericAmount <= (selectedCard?.maxAmount ?? 0) &&
    !!cardType &&
    (selectedCard.needsCode || cardType === "code" ? code.trim().length > 3 : true);

  const canSubmit =
    canContinueForm &&
    bankName.trim().length > 0 &&
    accountNumber.replace(/\D/g, "").length >= 10 &&
    accountName.trim().length >= 2;

  function selectCard(card: GiftCard) {
    setSelectedCard(card);
    setCountry(card.countries[0] ?? null);
    setCardType(card.types[0] ?? null);
    setAmount("");
    setCode("");
    setCvv("");
    setExpiry("");
    setStep("form");
  }

  function submitOrder() {
    if (!selectedCard || !country || !canSubmit) return;
    setOrders((prev) => [
      { id: `GC-${Date.now().toString().slice(-6)}`, card: selectedCard.name, amount: numericAmount, settlement, status: "Processing", country },
      ...prev,
    ]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2800);
    setStep("list");
    setSelectedCard(null);
    setAmount("");
    setCode("");
    setCvv("");
    setExpiry("");
    setBankName("");
    setAccountNumber("");
    setAccountName("");
  }

  const headerTitle = step === "list" ? "Sell Gift Card" : step === "form" ? "Card Details" : "Settlement Account";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          {step === "list" ? (
            <Link href="/home" className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]">
              <ArrowLeft size={20} />
            </Link>
          ) : (
            <button type="button" onClick={() => setStep(step === "review" ? "form" : "list")} className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-[15px] font-semibold text-[#0F172A]">{headerTitle}</h1>
          <span className="text-xs font-medium text-emerald-600 tabular-nums">₦0</span>
        </div>
      </header>

      {step === "list" && (
        <div className="px-4 pt-4 space-y-4">
          <div className="rounded-[14px] bg-[#0F172A] text-white p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0 text-lg">🎁</div>
            <div>
              <p className="text-sm font-semibold">Sell Gift Cards</p>
              <p className="text-[12px] text-white/70 mt-0.5">Instant rates · Secure settlement in Naira to your bank</p>
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search gift cards…" className="w-full h-11 pl-10 pr-3 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase mb-2">Gift Card List</p>
            <div className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden divide-y divide-[#F1F5F9]">
              {filteredCards.map((card) => (
                <button key={card.id} type="button" onClick={() => selectCard(card)} className="w-full flex items-center gap-3 px-3.5 py-3.5 text-left hover:bg-[#F8FAFC] active:bg-[#F1F5F9] transition-colors">
                  <CardLogo card={card} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A]">{card.name}</p>
                    <p className="text-[12px] text-[#64748B] mt-0.5">From {formatNaira(card.ratePerDollar)} / $1</p>
                  </div>
                  <ChevronRight size={16} className="text-[#94A3B8] shrink-0" />
                </button>
              ))}
            </div>
          </div>
          {orders.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase mb-2">Recent Sales</p>
              <div className="bg-white rounded-[14px] border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="px-3.5 py-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{o.card} · ${o.amount}</p>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{o.id} · {o.country}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#0F172A]">{formatNaira(o.settlement)}</p>
                      <p className="text-[11px] text-amber-600 flex items-center gap-1 justify-end"><Clock size={11} /> {o.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "form" && selectedCard && (
        <div className="px-4 pt-4 space-y-4">
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-3.5 flex items-center gap-3">
            <CardLogo card={selectedCard} />
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">{selectedCard.name}</p>
              <p className="text-[12px] text-[#64748B]">Rate: {formatNaira(selectedCard.ratePerDollar)} / $1</p>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Country</label>
            <button type="button" onClick={() => setCountryOpen(true)} className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] flex items-center justify-between text-sm font-medium text-[#0F172A]">
              <span>{COUNTRIES.find((c) => c.code === country)?.flag} {COUNTRIES.find((c) => c.code === country)?.name ?? "Select"}</span>
              <ChevronRight size={16} className="text-[#94A3B8]" />
            </button>
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Card Balance (USD)</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-[#64748B]">$</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder={`${selectedCard.minAmount} – ${selectedCard.maxAmount}`} inputMode="decimal" className="w-full h-12 pl-8 pr-3 rounded-[12px] bg-white border border-[#E2E8F0] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15 tabular-nums" />
            </div>
            <p className="mt-1.5 text-[11px] text-[#94A3B8]">Min ${selectedCard.minAmount} · Max ${selectedCard.maxAmount}</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Type</label>
            <div className="mt-1.5 flex gap-2">
              {selectedCard.types.map((t) => (
                <button key={t} type="button" onClick={() => setCardType(t)} className={`flex-1 h-11 rounded-[12px] text-sm font-medium capitalize transition ${cardType === t ? "bg-[#1877F2] text-white" : "bg-white border border-[#E2E8F0] text-[#64748B]"}`}>{t}</button>
              ))}
            </div>
          </div>
          {(selectedCard.needsCode || cardType === "code") && (
            <div>
              <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Card Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter card code" className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15" />
            </div>
          )}
          {selectedCard.needsCvv && cardType === "physical" && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">CVV</label>
                <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} placeholder="CVV" inputMode="numeric" className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2]" />
              </div>
              <div>
                <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Expiry</label>
                <input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2]" />
              </div>
            </div>
          )}
          <div className="rounded-[14px] bg-[#0F172A] text-white p-4">
            <p className="text-[11px] font-semibold tracking-wide text-white/60 uppercase">Settlement Amount</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{formatNaira(settlement)}</p>
            <p className="text-[12px] text-white/65 mt-1">Paid to your bank account after verification</p>
          </div>
          <button type="button" disabled={!canContinueForm} onClick={() => setStep("review")} className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#166FE5] transition">Continue</button>
        </div>
      )}

      {step === "review" && selectedCard && (
        <div className="px-4 pt-4 space-y-4">
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CardLogo card={selectedCard} />
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">{selectedCard.name}</p>
                <p className="text-[12px] text-[#64748B]">${numericAmount} · {country}</p>
              </div>
            </div>
            <div className="h-px bg-[#F1F5F9]" />
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">You receive</span>
              <span className="font-bold text-[#0F172A] tabular-nums">{formatNaira(settlement)}</span>
            </div>
          </div>
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-4 space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-[10px] bg-[#EFF6FF] text-[#1877F2] flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Settlement Bank Account</p>
                <p className="text-[11px] text-[#64748B]">Where we pay your Naira after verification</p>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Bank</label>
              <button type="button" onClick={() => setBankOpen(true)} className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-sm font-medium text-[#0F172A]">
                <span className={bankName ? "text-[#0F172A]" : "text-[#94A3B8]"}>{bankName || "Select bank"}</span>
                <ChevronRight size={16} className="text-[#94A3B8]" />
              </button>
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Account Number</label>
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))} placeholder="0123456789" inputMode="numeric" className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15 tabular-nums" />
            </div>
            <div>
              <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Account Name</label>
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="As it appears on your bank account" className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15" />
            </div>
          </div>
          <button type="button" disabled={!canSubmit} onClick={submitOrder} className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#166FE5] transition">Submit for Settlement</button>
          <p className="text-[11px] text-center text-[#94A3B8]">Funds are paid to the bank account above after card verification</p>
        </div>
      )}

      {countryOpen && selectedCard && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => setCountryOpen(false)} />
          <div className="relative bg-white rounded-t-[20px] max-h-[55vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-base font-semibold text-[#0F172A]">Select Country</h3>
              <button type="button" onClick={() => setCountryOpen(false)} className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto px-2 pb-8">
              {COUNTRIES.filter((c) => selectedCard.countries.includes(c.code)).map((c) => (
                <button key={c.code} type="button" onClick={() => { setCountry(c.code); setCountryOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-[12px] text-left ${country === c.code ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"}`}>
                  <span className="text-lg">{c.flag}</span>
                  <span className={`text-sm font-medium ${country === c.code ? "text-[#1877F2]" : "text-[#0F172A]"}`}>{c.name}</span>
                  {country === c.code && <CheckCircle2 size={16} className="ml-auto text-[#1877F2]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {bankOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close" onClick={() => setBankOpen(false)} />
          <div className="relative bg-white rounded-t-[20px] max-h-[60vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-base font-semibold text-[#0F172A]">Select Bank</h3>
              <button type="button" onClick={() => setBankOpen(false)} className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"><X size={16} /></button>
            </div>
            <div className="overflow-y-auto px-2 pb-8">
              {BANKS.map((b) => (
                <button key={b} type="button" onClick={() => { setBankName(b); setBankOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-[12px] text-left ${bankName === b ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"}`}>
                  <span className={`text-sm font-medium ${bankName === b ? "text-[#1877F2]" : "text-[#0F172A]"}`}>{b}</span>
                  {bankName === b && <CheckCircle2 size={16} className="ml-auto text-[#1877F2]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-16 left-4 right-4 z-[80] flex justify-center">
          <div className="bg-[#0F172A] text-white text-sm font-medium px-4 py-3 rounded-[12px] shadow-lg flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Order submitted — settlement to your bank
          </div>
        </div>
      )}
    </div>
  );
}
