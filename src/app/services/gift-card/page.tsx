"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Gift,
  Search,
  X,
  CheckCircle2,
  ChevronRight,
  Upload,
  Clock,
  Info,
  Copy,
} from "lucide-react";

type CardType = "code" | "physical" | "tag" | "email";

type GiftCard = {
  id: string;
  name: string;
  color: string;
  bg: string;
  initial: string;
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
  {
    id: "steam",
    name: "Steam",
    color: "#1B2838",
    bg: "#E8EEF5",
    initial: "S",
    countries: ["US", "UK", "EUR", "CAD", "AUD"],
    types: ["code"],
    ratePerDollar: 1050,
    minAmount: 5,
    maxAmount: 500,
    needsCode: true,
  },
  {
    id: "apple",
    name: "Apple (iTunes)",
    color: "#000000",
    bg: "#F5F5F5",
    initial: "A",
    countries: ["US", "UK", "EUR", "CAD", "AUD"],
    types: ["code", "physical"],
    ratePerDollar: 1080,
    minAmount: 10,
    maxAmount: 500,
    needsCode: true,
    needsCvv: true,
    needsExpiry: true,
  },
  {
    id: "google",
    name: "Google Play",
    color: "#34A853",
    bg: "#E8F5E9",
    initial: "G",
    countries: ["US", "UK", "EUR", "CAD"],
    types: ["code"],
    ratePerDollar: 1020,
    minAmount: 5,
    maxAmount: 200,
    needsCode: true,
  },
  {
    id: "amazon",
    name: "Amazon",
    color: "#FF9900",
    bg: "#FFF8E7",
    initial: "Am",
    countries: ["US", "UK", "EUR", "CAD", "AUD"],
    types: ["code", "physical"],
    ratePerDollar: 1040,
    minAmount: 10,
    maxAmount: 500,
    needsCode: true,
  },
  {
    id: "razer",
    name: "Razer Gold",
    color: "#44D62C",
    bg: "#E8FBE8",
    initial: "R",
    countries: ["US", "UK", "EUR", "CAD"],
    types: ["code"],
    ratePerDollar: 980,
    minAmount: 5,
    maxAmount: 200,
    needsCode: true,
  },
  {
    id: "xbox",
    name: "Xbox",
    color: "#107C10",
    bg: "#E8F5E9",
    initial: "X",
    countries: ["US", "UK", "EUR", "CAD"],
    types: ["code"],
    ratePerDollar: 1010,
    minAmount: 10,
    maxAmount: 200,
    needsCode: true,
  },
  {
    id: "ebay",
    name: "eBay",
    color: "#E53238",
    bg: "#FFEBEE",
    initial: "eB",
    countries: ["US", "UK", "EUR"],
    types: ["code"],
    ratePerDollar: 990,
    minAmount: 10,
    maxAmount: 300,
    needsCode: true,
  },
  {
    id: "chime",
    name: "Chime",
    color: "#1EC677",
    bg: "#E6F9F0",
    initial: "C",
    countries: ["US"],
    types: ["tag", "email"],
    ratePerDollar: 1055,
    minAmount: 20,
    maxAmount: 1000,
  },
  {
    id: "vanilla",
    name: "Vanilla",
    color: "#E31837",
    bg: "#FFEBEE",
    initial: "V",
    countries: ["US"],
    types: ["physical", "code"],
    ratePerDollar: 920,
    minAmount: 10,
    maxAmount: 500,
    needsCode: true,
    needsCvv: true,
    needsExpiry: true,
  },
  {
    id: "visa",
    name: "Visa Gift",
    color: "#1A1F71",
    bg: "#E8EAF6",
    initial: "Vi",
    countries: ["US", "UK", "CAD"],
    types: ["physical", "code"],
    ratePerDollar: 950,
    minAmount: 25,
    maxAmount: 500,
    needsCode: true,
    needsCvv: true,
    needsExpiry: true,
  },
];

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
  { code: "EUR", name: "Eurozone", flag: "🇪🇺" },
  { code: "CAD", name: "Canada", flag: "🇨🇦" },
  { code: "AUD", name: "Australia", flag: "🇦🇺" },
];

const WALLET = 0;

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function CardLogo({ card, size = "md" }: { card: GiftCard; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8 text-[10px]" : "w-11 h-11 text-xs";
  return (
    <div
      className={`${dim} rounded-[10px] flex items-center justify-center font-bold shrink-0`}
      style={{ backgroundColor: card.bg, color: card.color }}
    >
      {card.initial}
    </div>
  );
}

type Step = "list" | "form" | "review" | "transfer";

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
  const [orders, setOrders] = useState<
    {
      id: string;
      card: string;
      amount: number;
      settlement: number;
      status: string;
      country: string;
    }[]
  >([]);
  const [success, setSuccess] = useState(false);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return GIFT_CARDS;
    return GIFT_CARDS.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  const numericAmount = Number(amount) || 0;
  const settlement =
    selectedCard && numericAmount > 0
      ? Math.round(selectedCard.ratePerDollar * numericAmount)
      : 0;

  const canContinue =
    !!selectedCard &&
    !!country &&
    numericAmount >= (selectedCard?.minAmount ?? 0) &&
    numericAmount <= (selectedCard?.maxAmount ?? 0) &&
    !!cardType &&
    (selectedCard.needsCode ? code.trim().length > 3 : true);

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

  function goReview() {
    if (!canContinue) return;
    setStep("review");
  }

  function goTransfer() {
    setStep("transfer");
  }

  function submitOrder() {
    if (!selectedCard || !country) return;
    setOrders((prev) => [
      {
        id: `GC-${Date.now().toString().slice(-6)}`,
        card: selectedCard.name,
        amount: numericAmount,
        settlement,
        status: "Awaiting Receipt",
        country,
      },
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
  }

  function copyText(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          {step === "list" ? (
            <Link
              href="/home"
              className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]"
            >
              <ArrowLeft size={18} />
              Back
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (step === "form") setStep("list");
                else if (step === "review") setStep("form");
                else if (step === "transfer") setStep("review");
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]"
            >
              <ArrowLeft size={18} />
              Back
            </button>
          )}
          <h1 className="text-sm font-semibold text-[#0F172A]">
            {step === "list" && "Sell Gift Card"}
            {step === "form" && "Card Details"}
            {step === "review" && "Review Quote"}
            {step === "transfer" && "Transfer & Upload"}
          </h1>
          <span className="text-sm font-semibold text-[#16A34A] tabular-nums">
            {formatNaira(WALLET)}
          </span>
        </div>
      </header>

      {step === "list" && (
        <div className="px-4 pt-4 space-y-4">
          <div className="rounded-[14px] bg-gradient-to-br from-[#0B1220] to-[#152238] p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-[12px] bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <Gift size={22} className="text-white" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white leading-tight">
                Sell Gift Cards
              </p>
              <p className="text-[12px] text-slate-300 mt-0.5 leading-snug">
                Instant rates · Secure settlement in Naira
              </p>
            </div>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gift cards..."
              className="w-full h-11 pl-10 pr-3 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-[#0F172A] mb-2.5">
              Gift Card List
            </h2>
            <div className="space-y-2">
              {filteredCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => selectCard(card)}
                  className="w-full flex items-center gap-3 rounded-[14px] bg-white border border-[#E2E8F0] px-3.5 py-3.5 text-left active:scale-[0.99] transition hover:border-[#1877F2]/40"
                >
                  <CardLogo card={card} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {card.name}
                    </p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">
                      From {formatNaira(card.ratePerDollar)} / $1
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-[#CBD5E1]" />
                </button>
              ))}
              {filteredCards.length === 0 && (
                <div className="rounded-[14px] bg-white border border-[#E2E8F0] py-12 text-center">
                  <p className="text-sm text-[#94A3B8]">No cards found</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <h2 className="text-sm font-semibold text-[#0F172A] mb-2.5">
              Recent Sales
            </h2>
            {orders.length === 0 ? (
              <div className="rounded-[12px] bg-white border border-[#E2E8F0] py-10 text-center">
                <p className="text-sm text-[#94A3B8]">No sales yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-[12px] bg-white border border-[#E2E8F0] px-3.5 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">
                          {o.card} · ${o.amount}
                        </p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">
                          {o.id} · {o.country}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-[#0F172A] tabular-nums">
                          {formatNaira(o.settlement)}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          {o.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === "form" && selectedCard && (
        <div className="px-4 pt-4 space-y-4">
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-4 flex items-center gap-3">
            <CardLogo card={selectedCard} />
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">
                {selectedCard.name}
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                Rate: {formatNaira(selectedCard.ratePerDollar)} / $1
              </p>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
              Country
            </label>
            <button
              type="button"
              onClick={() => setCountryOpen(true)}
              className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] flex items-center justify-between text-left"
            >
              <span className="text-sm font-medium text-[#0F172A]">
                {COUNTRIES.find((c) => c.code === country)?.flag}{" "}
                {COUNTRIES.find((c) => c.code === country)?.name ?? "Select country"}
              </span>
              <span className="text-[#94A3B8] text-xs">▼</span>
            </button>
          </div>

          <div>
            <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
              Card Balance (USD)
            </label>
            <div className="mt-1.5 relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/[^0-9.]/g, ""))
                }
                placeholder={`${selectedCard.minAmount} – ${selectedCard.maxAmount}`}
                className="w-full h-12 pl-8 pr-3 rounded-[12px] bg-white border border-[#E2E8F0] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15 tabular-nums"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[#94A3B8]">
              Min ${selectedCard.minAmount} · Max ${selectedCard.maxAmount}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
              Type
            </label>
            <div className="mt-1.5 flex gap-2">
              {selectedCard.types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCardType(t)}
                  className={`flex-1 h-11 rounded-[12px] text-sm font-medium capitalize transition ${
                    cardType === t
                      ? "bg-[#1877F2] text-white"
                      : "bg-white border border-[#E2E8F0] text-[#64748B]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {(selectedCard.needsCode || cardType === "code") && (
            <div>
              <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
                Card Code
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter card code"
                className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
              />
            </div>
          )}

          {selectedCard.needsCvv && cardType === "physical" && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
                  CVV
                </label>
                <input
                  value={cvv}
                  onChange={(e) =>
                    setCvv(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                  }
                  placeholder="CVV"
                  inputMode="numeric"
                  className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
                  Expiry
                </label>
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2]"
                />
              </div>
            </div>
          )}

          <div className="rounded-[14px] bg-white border border-[#E2E8F0] overflow-hidden">
            <div className="bg-gradient-to-br from-[#0B1220] to-[#152238] px-4 py-4">
              <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                Settlement Amount
              </p>
              <p className="text-2xl font-semibold text-white tabular-nums mt-1">
                {numericAmount > 0 ? formatNaira(settlement) : "₦0"}
              </p>
              <p className="mt-1 text-[12px] text-slate-400">
                You receive this in your Vernex wallet after verification
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!canContinue}
            onClick={goReview}
            className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] transition"
          >
            Continue
          </button>

          <div className="flex gap-2.5 rounded-[12px] bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-3">
            <Info size={16} className="text-[#1877F2] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#1E3A5F] leading-relaxed">
              Different cards require different details. Rates and required fields
              come from the provider API. Always enter accurate information.
            </p>
          </div>
        </div>
      )}

      {step === "review" && selectedCard && (
        <div className="px-4 pt-4 space-y-4">
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Category</span>
              <span className="font-medium text-[#0F172A] flex items-center gap-1.5">
                <CardLogo card={selectedCard} size="sm" />
                {selectedCard.name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Country</span>
              <span className="font-medium text-[#0F172A]">
                {COUNTRIES.find((c) => c.code === country)?.flag} {country}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Amount</span>
              <span className="font-medium text-[#0F172A] tabular-nums">
                ${numericAmount}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Type</span>
              <span className="font-medium text-[#0F172A] capitalize">
                {cardType}
              </span>
            </div>
            <div className="border-t border-[#E2E8F0] pt-3 flex justify-between">
              <span className="text-sm font-medium text-[#0F172A]">
                Settlement Amount
              </span>
              <span className="text-lg font-bold text-[#16A34A] tabular-nums">
                {formatNaira(settlement)}
              </span>
            </div>
          </div>

          <div className="rounded-[12px] bg-amber-50 border border-amber-200 px-3.5 py-3 flex gap-2.5">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[12px] text-amber-900 leading-relaxed">
              Please note: the information you provide will affect the final
              transaction. Make sure everything is correct before continuing.
            </p>
          </div>

          <button
            type="button"
            onClick={goTransfer}
            className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold active:scale-[0.99] transition"
          >
            Proceed to Transfer
          </button>
        </div>
      )}

      {step === "transfer" && selectedCard && (
        <div className="px-4 pt-4 space-y-4">
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Category</span>
              <span className="font-medium text-[#0F172A]">
                {selectedCard.name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Order ID</span>
              <span className="font-medium text-[#0F172A] flex items-center gap-1">
                GC-DEMO01
                <button
                  type="button"
                  onClick={() => copyText("GC-DEMO01")}
                  className="text-[#1877F2]"
                >
                  <Copy size={14} />
                </button>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Amount to Transfer</span>
              <span className="font-medium text-[#0F172A]">${numericAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#64748B]">Settlement</span>
              <span className="font-semibold text-[#16A34A] tabular-nums">
                {formatNaira(settlement)}
              </span>
            </div>
          </div>

          <div className="rounded-[14px] bg-red-50 border border-red-200 px-3.5 py-3">
            <p className="text-[12px] text-red-800 leading-relaxed">
              Please transfer the gift card value as instructed and upload the
              receipt within the time limit. Incorrect or late submissions may
              cause the order to fail.
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="text-[11px] font-medium text-red-700">
                Time left
              </span>
              <span className="text-sm font-bold tabular-nums text-red-700 bg-red-100 px-2 py-0.5 rounded">
                29:59
              </span>
            </div>
          </div>

          <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-4 space-y-3">
            <p className="text-sm font-semibold text-[#0F172A]">
              Upload Transfer Receipt
            </p>
            <div>
              <label className="text-[11px] font-medium text-[#64748B]">
                Sender Name
              </label>
              <input
                placeholder="Enter sender name"
                className="mt-1 w-full h-11 px-3 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1877F2]"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#64748B]">
                Transfer Receipt
              </label>
              <button
                type="button"
                className="mt-1 w-full h-24 rounded-[12px] border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] flex flex-col items-center justify-center gap-1.5 text-[#94A3B8]"
              >
                <Upload size={22} />
                <span className="text-xs">Tap to upload screenshot</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={submitOrder}
            className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold active:scale-[0.99] transition"
          >
            Submit Order
          </button>
        </div>
      )}

      {countryOpen && selectedCard && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setCountryOpen(false)}
          />
          <div className="relative bg-white rounded-t-[20px] max-h-[55vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-base font-semibold text-[#0F172A]">
                Select Country
              </h3>
              <button
                type="button"
                onClick={() => setCountryOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"
              >
                <X size={16} />
              </button>
            </div>
            <div className="overflow-y-auto px-2 pb-8">
              {COUNTRIES.filter((c) =>
                selectedCard.countries.includes(c.code)
              ).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCountry(c.code);
                    setCountryOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-[12px] text-left ${
                    country === c.code ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"
                  }`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span
                    className={`text-sm font-medium ${
                      country === c.code ? "text-[#1877F2]" : "text-[#0F172A]"
                    }`}
                  >
                    {c.name}
                  </span>
                  {country === c.code && (
                    <CheckCircle2 size={16} className="ml-auto text-[#1877F2]" />
                  )}
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
            Gift card order submitted (demo)
          </div>
        </div>
      )}
    </div>
  );
}
