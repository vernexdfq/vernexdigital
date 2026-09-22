"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search, X, ChevronRight, Plus, Home, History as HistoryIcon, Wallet, Sparkles } from "lucide-react";

type GiftCard = { id: string; name: string; logo: string; rate: number; physical?: boolean; egift?: boolean };

const CARDS: GiftCard[] = [
  { id: "apple", name: "iTunes (Apple)", logo: "https://logo.clearbit.com/apple.com", rate: 1334.45, physical: true, egift: true },
  { id: "razer", name: "Razer", logo: "https://logo.clearbit.com/razer.com", rate: 1170.21, physical: true, egift: true },
  { id: "steam", name: "Steam", logo: "https://logo.clearbit.com/steampowered.com", rate: 1334.45, physical: true, egift: true },
  { id: "xbox", name: "Xbox", logo: "https://logo.clearbit.com/xbox.com", rate: 1262.6, physical: true, egift: true },
  { id: "green-razer", name: "Green Razer", logo: "https://logo.clearbit.com/razer.com", rate: 1170.21, physical: true, egift: true },
  { id: "sephora", name: "Sephora", logo: "https://logo.clearbit.com/sephora.com", rate: 1088.09, physical: true, egift: true },
  { id: "footlocker", name: "Footlocker", logo: "https://logo.clearbit.com/footlocker.com", rate: 1129.15, physical: true, egift: true },
  { id: "macys", name: "Macys", logo: "https://logo.clearbit.com/macys.com", rate: 1108.62, physical: true, egift: true },
  { id: "nordstrom", name: "Nordstrom", logo: "https://logo.clearbit.com/nordstrom.com", rate: 954.65, physical: true, egift: true },
  { id: "playstation", name: "PlayStation", logo: "https://logo.clearbit.com/playstation.com", rate: 882.79, physical: true, egift: true },
  { id: "cvs", name: "CVS Pharmacy", logo: "https://logo.clearbit.com/cvs.com", rate: 1118.89, physical: true, egift: true },
  { id: "dollar-general", name: "Dollar General", logo: "https://logo.clearbit.com/dollargeneral.com", rate: 1118.89, physical: true, egift: true },
  { id: "google", name: "Google Play", logo: "https://logo.clearbit.com/play.google.com", rate: 964.91, egift: true },
  { id: "roblox", name: "Roblox", logo: "https://logo.clearbit.com/roblox.com", rate: 821.2, physical: true, egift: true },
  { id: "gamestop", name: "Gamestop", logo: "https://logo.clearbit.com/gamestop.com", rate: 1026.5, physical: true, egift: true },
  { id: "paysafe", name: "Paysafe Card", logo: "https://logo.clearbit.com/paysafecard.com", rate: 1449.42, physical: true, egift: true },
  { id: "one4all", name: "One4All", logo: "https://logo.clearbit.com/one4all.com", rate: 1067.56, physical: true, egift: true },
  { id: "amazon", name: "Amazon", logo: "https://logo.clearbit.com/amazon.com", rate: 1040, physical: true, egift: true },
];

const BANKS = [
  { id: "opay", name: "OPay", color: "#1DCC70" },
  { id: "moniepoint", name: "Moniepoint", color: "#0066FF" },
  { id: "kuda", name: "Kuda MFB", color: "#40196D" },
  { id: "palmpay", name: "PalmPay", color: "#6C3CE1" },
  { id: "gtb", name: "GTBank", color: "#E35424" },
  { id: "firstbank", name: "First Bank Of Nigeria", color: "#0033A1" },
  { id: "uba", name: "UNITED BANK FOR AFRICA", color: "#D21034" },
  { id: "access", name: "Access Bank", color: "#F7941D" },
  { id: "zenith", name: "Zenith Bank", color: "#E30613" },
  { id: "fidelity", name: "Fidelity Bank", color: "#6B2D7B" },
  { id: "stanbic", name: "Stanbic IBTC", color: "#0033A0" },
  { id: "wema", name: "Wema Bank", color: "#7B1FA2" },
  { id: "fcmb", name: "FCMB", color: "#5C2D91" },
  { id: "union", name: "Union Bank", color: "#00A651" },
  { id: "polaris", name: "Polaris Bank", color: "#6B2D91" },
  { id: "globus", name: "Globus Bank", color: "#E30613" },
  { id: "parallex", name: "PARALLEX BANK", color: "#1A237E" },
  { id: "9psb", name: "9 PSB", color: "#00A651" },
];

const TRADES = [
  { user: "T****M", card: "Razer AUD 325*1", naira: 258882 },
  { user: "W****h", card: "iTunes IT 100*3", naira: 301791 },
  { user: "2****P", card: "iTunes USD 350*2", naira: 689808 },
  { user: "A****m", card: "Xbox UK 220*1", naira: 277772 },
  { user: "B****P", card: "Steam USD 200*1", naira: 203248 },
  { user: "3****F", card: "Dollar General USD 450*1", naira: 503500 },
  { user: "X****d", card: "Macys USD 235*3", naira: 578946 },
  { user: "P****c", card: "iTunes IT 200*1", naira: 201194 },
  { user: "s****P", card: "iTunes USD 500*2", naira: 1026500 },
  { user: "M****u", card: "Razer USD 20*1", naira: 23404 },
];

type Tab = "home" | "history" | "withdraw";
type HistFilter = "ALL" | "PENDING" | "SUCCESS" | "REJECTED";
type Entry = { face: string; qty: string; code: string };

function naira(n: number) {
  return "\u20a6" + n.toLocaleString("en-NG", { maximumFractionDigits: 2 });
}

function Logo({ src, name, size = 40 }: { src: string; name: string; size?: number }) {
  const [fail, setFail] = useState(false);
  if (fail) {
    return (
      <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0" style={{ width: size, height: size, background: "#1877F2", fontSize: size * 0.35 }}>
        {name.charAt(0)}
      </div>
    );
  }
  return (
    <div className="rounded-full overflow-hidden bg-white border border-[#E2E8F0] shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <img src={src} alt={name} className="w-full h-full object-contain p-1" onError={() => setFail(true)} />
    </div>
  );
}

export default function GiftCardPage() {
  const [tab, setTab] = useState<Tab>("home");
  const [view, setView] = useState<"list" | "sell" | "addbank">("list");
  const [selected, setSelected] = useState<GiftCard | null>(null);
  const [cardMode, setCardMode] = useState<"physical" | "egift">("physical");
  const [entries, setEntries] = useState<Entry[]>([{ face: "", qty: "1", code: "" }]);
  const [histFilter, setHistFilter] = useState<HistFilter>("ALL");
  const [orders, setOrders] = useState<{ id: string; card: string; settlement: number; status: HistFilter; when: string }[]>([]);
  const [bankOpen, setBankOpen] = useState(false);
  const [bankQ, setBankQ] = useState("");
  const [bank, setBank] = useState<(typeof BANKS)[0] | null>(null);
  const [acct, setAcct] = useState("");
  const [acctName, setAcctName] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [confirmBank, setConfirmBank] = useState(false);
  const [savedBanks, setSavedBanks] = useState<{ bank: string; acct: string; name: string }[]>([]);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const t = setInterval(() => setTickerIdx((i) => (i + 1) % TRADES.length), 3200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (acct.replace(/\D/g, "").length >= 10 && bank) {
      setDetecting(true);
      const t = setTimeout(() => {
        setAcctName("IFEANYI UGWU");
        setDetecting(false);
        setConfirmBank(true);
      }, 900);
      return () => clearTimeout(t);
    }
    setAcctName("");
  }, [acct, bank]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? CARDS.filter((c) => c.name.toLowerCase().includes(q)) : CARDS;
  }, [search]);

  const filteredBanks = useMemo(() => {
    const q = bankQ.trim().toLowerCase();
    return q ? BANKS.filter((b) => b.name.toLowerCase().includes(q)) : BANKS;
  }, [bankQ]);

  const rate = selected?.rate ?? 0;
  const totalFace = entries.reduce((s, e) => s + (Number(e.face) || 0) * (Number(e.qty) || 0), 0);
  const earn = Math.round(totalFace * rate * 100) / 100;
  const filteredOrders = orders.filter((o) => histFilter === "ALL" || o.status === histFilter);
  const trade = TRADES[tickerIdx];

  function openSell(c: GiftCard) {
    setSelected(c);
    setCardMode(c.physical ? "physical" : "egift");
    setEntries([{ face: "", qty: "1", code: "" }]);
    setView("sell");
  }

  function submitSale() {
    if (!selected || totalFace <= 0) return;
    setOrders((prev) => [{ id: "GC-" + Date.now().toString().slice(-6), card: selected.name, settlement: earn, status: "PENDING", when: "Just now" }, ...prev]);
    setView("list");
    setTab("history");
    setHistFilter("PENDING");
    setSelected(null);
  }

  function saveBank() {
    if (!bank || !acct || !acctName) return;
    setSavedBanks((p) => [{ bank: bank.name, acct, name: acctName }, ...p]);
    setConfirmBank(false);
    setView("list");
    setTab("withdraw");
    setBank(null);
    setAcct("");
    setAcctName("");
  }

  if (view === "sell" && selected) {
    return (
      <div className="min-h-screen bg-[#F0F7FF] pb-8">
        <header className="sticky top-0 z-30 bg-gradient-to-b from-[#E8F1FF] to-[#F0F7FF] px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setView("list")} className="w-9 h-9 flex items-center justify-center text-[#0F172A]"><ArrowLeft size={22} /></button>
            <h1 className="text-lg font-semibold text-[#0F172A]">Sell Gift Cards</h1>
          </div>
        </header>
        <div className="px-4 space-y-3">
          <button type="button" onClick={() => setView("list")} className="w-full bg-white rounded-[14px] border border-[#E2E8F0] px-4 py-3.5 flex items-center gap-3">
            <Logo src={selected.logo} name={selected.name} size={36} />
            <span className="flex-1 text-left text-sm font-semibold text-[#0F172A]">{selected.name}</span>
            <ChevronRight size={18} className="text-[#94A3B8]" />
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => setCardMode("physical")} className={`flex-1 h-10 rounded-full text-sm font-semibold ${cardMode === "physical" ? "bg-[#0F172A] text-white" : "bg-white border border-[#E2E8F0] text-[#64748B]"}`}>Physical Card</button>
            <button type="button" onClick={() => setCardMode("egift")} className={`flex-1 h-10 rounded-full text-sm font-semibold ${cardMode === "egift" ? "bg-[#0F172A] text-white" : "bg-white border border-[#E2E8F0] text-[#64748B]"}`}>E-Gift Card</button>
          </div>
          <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-4 space-y-2 text-[12px]">
            <div className="flex justify-between items-center"><span className="text-sm font-medium">USD</span><span className="text-xs text-[#1877F2] font-medium">Rules</span></div>
            <div className="flex justify-between text-[#64748B]"><span>200/300/400/500</span><span>1$ = {naira(rate)}</span></div>
            <div className="flex justify-between text-[#64748B]"><span>100/150/250</span><span>1$ = {naira(rate * 0.96)}</span></div>
          </div>
          {entries.map((entry, i) => (
            <div key={i} className="bg-white rounded-[14px] border border-[#E2E8F0] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0F172A]">Card {i + 1}</p>
                {i > 0 && <button type="button" onClick={() => setEntries((e) => e.filter((_, j) => j !== i))} className="text-[#94A3B8]"><X size={16} /></button>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-[#64748B]">Face Value</label>
                  <input value={entry.face} onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ""); setEntries((p) => p.map((x, j) => (j === i ? { ...x, face: v } : x))); }} placeholder="0" inputMode="decimal" className="mt-1 w-full h-11 px-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm" />
                </div>
                <div>
                  <label className="text-[11px] text-[#64748B]">Qty</label>
                  <input value={entry.qty} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, "") || "1"; setEntries((p) => p.map((x, j) => (j === i ? { ...x, qty: v } : x))); }} inputMode="numeric" className="mt-1 w-full h-11 px-2 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm text-center" />
                </div>
                <div>
                  <label className="text-[11px] text-[#64748B]">You get</label>
                  <div className="mt-1 h-11 px-2 rounded-[10px] bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-sm font-semibold text-[#1877F2] tabular-nums">{naira((Number(entry.face) || 0) * (Number(entry.qty) || 0) * rate)}</div>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#64748B]">Code</label>
                <input value={entry.code} onChange={(e) => setEntries((p) => p.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))} placeholder="Enter the card code" className="mt-1 w-full h-11 px-3 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-[#64748B]">Card Images (max 5)</label>
                <button type="button" className="mt-1.5 w-16 h-16 rounded-[12px] border-2 border-dashed border-[#CBD5E1] flex items-center justify-center text-[#94A3B8] bg-[#F8FAFC]"><Plus size={22} /></button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setEntries((e) => [...e, { face: "", qty: "1", code: "" }])} className="w-full h-11 rounded-[12px] border border-dashed border-[#1877F2]/40 text-[#1877F2] text-sm font-medium">+ Send More Cards</button>
          <div className="flex items-center justify-between pt-2 pb-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Earn</p>
              <p className="text-lg font-bold text-[#1877F2] tabular-nums">{naira(earn)}</p>
            </div>
            <button type="button" disabled={totalFace <= 0} onClick={submitSale} className="h-12 px-8 rounded-full bg-[#1877F2] text-white text-sm font-semibold disabled:opacity-40">Submit</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "addbank") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pb-24">
        <header className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
          <button type="button" onClick={() => { setView("list"); setTab("withdraw"); }} className="text-[#0F172A]"><ArrowLeft size={22} /></button>
          <h1 className="text-lg font-semibold text-[#0F172A]">Add Bank Card</h1>
        </header>
        <div className="px-4 pt-5 space-y-4">
          <button type="button" onClick={() => setBankOpen(true)} className="w-full h-12 px-4 rounded-[12px] bg-white border border-[#E2E8F0] flex items-center justify-between text-sm">
            <span className={bank ? "font-medium text-[#0F172A]" : "text-[#1877F2]">{bank ? bank.name : "Select Your Bank"}</span>
            <ChevronRight size={16} className="text-[#94A3B8] rotate-90" />
          </button>
          <input value={acct} onChange={(e) => setAcct(e.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="Account Number (8-13 Digits)" inputMode="numeric" className="w-full h-12 px-4 rounded-[12px] bg-white border border-[#E2E8F0] text-sm" />
          <p className="text-[11px] text-[#94A3B8]">Please make sure your bank name and account number are correct.</p>
          {detecting && <p className="text-sm text-[#1877F2]">Detecting account name...</p>}
          {acctName && !confirmBank && <p className="text-sm font-medium text-[#0F172A]">Account name: {acctName}</p>}
        </div>
        {bankOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setBankOpen(false)} />
            <div className="relative bg-white rounded-t-[20px] max-h-[70vh] flex flex-col">
              <div className="px-4 pt-4 pb-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input value={bankQ} onChange={(e) => setBankQ(e.target.value)} placeholder="Search for bank" className="w-full h-11 pl-9 pr-3 rounded-full bg-[#F1F5F9] text-sm" autoFocus />
                </div>
              </div>
              <div className="overflow-y-auto px-2 pb-8">
                {filteredBanks.map((b) => (
                  <button key={b.id} type="button" onClick={() => { setBank(b); setBankOpen(false); setBankQ(""); }} className="w-full flex items-center gap-3 px-3 py-3.5 rounded-[12px] hover:bg-[#F8FAFC] text-left">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: b.color }}>{b.name.slice(0, 2).toUpperCase()}</div>
                    <span className="text-sm font-medium text-[#0F172A]">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {confirmBank && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setConfirmBank(false)} />
            <div className="relative bg-white rounded-[16px] p-5 w-full max-w-sm shadow-xl">
              <p className="text-base font-semibold text-[#0F172A] mb-2">Prompt</p>
              <p className="text-sm text-[#475569]">Are you sure you want to add bankno {acct} with account name {acctName}?</p>
              <div className="flex justify-end gap-4 mt-5">
                <button type="button" onClick={() => setConfirmBank(false)} className="text-sm font-medium text-[#64748B]">Cancel</button>
                <button type="button" onClick={saveBank} className="text-sm font-semibold text-[#1877F2]">OK</button>
              </div>
            </div>
          </div>
        )}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E2E8F0]">
          <button type="button" disabled={!bank || acct.length < 8 || !acctName} onClick={() => acctName && setConfirmBank(true)} className="w-full h-12 rounded-full bg-[#1877F2] text-white text-sm font-semibold disabled:opacity-40">Submit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F1FF] via-[#F0F7FF] to-white pb-24">
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[12px] text-[#64748B]">Total Balance</p>
            <p className="text-3xl font-bold text-[#0F172A] tabular-nums mt-0.5">0.00 <span className="text-sm font-medium text-[#64748B]">ngn</span></p>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-sm font-bold text-[#1877F2]">GC</div>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={() => setTab("withdraw")} className="flex-1 h-11 rounded-full bg-white border border-[#E2E8F0] text-sm font-semibold text-[#0F172A]">WITHDRAWAL</button>
          <button type="button" onClick={() => setTab("home")} className="flex-1 h-11 rounded-full bg-[#0F172A] text-white text-sm font-semibold">SALE NOW</button>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {["Activities", "Invite", "Coupons", "Prize Draw", "Balance"].map((label) => (
            <button key={label} type="button" className="flex flex-col items-center gap-1.5">
              <div className="w-11 h-11 rounded-[12px] bg-white border border-[#E2E8F0] flex items-center justify-center text-[10px] font-semibold text-[#1877F2] shadow-sm">{label.slice(0, 2)}</div>
              <span className="text-[10px] text-[#64748B] text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => setTab("history")} className="mx-4 mb-3 w-[calc(100%-2rem)] bg-white rounded-full border border-[#E2E8F0] px-3 py-2.5 flex items-center gap-2.5 shadow-sm text-left">
        <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-xs font-bold text-[#1877F2] shrink-0">U</div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-[#0F172A] truncate">{trade.user} trade {trade.card}</p>
          <p className="text-[11px] text-[#1877F2] font-semibold tabular-nums">{naira(trade.naira)}</p>
        </div>
        <ChevronRight size={16} className="text-[#94A3B8] shrink-0" />
      </button>

      {tab === "home" && (
        <div className="px-4 space-y-1">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search gift cards..." className="w-full h-10 pl-9 pr-3 rounded-full bg-white border border-[#E2E8F0] text-sm" />
          </div>
          {filteredCards.map((c) => (
            <div key={c.id} className="flex items-center gap-3 bg-white rounded-[14px] border border-[#E2E8F0] px-3 py-3">
              <Logo src={c.logo} name={c.name} size={42} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A] truncate">{c.name}</p>
                <p className="text-[12px] text-[#64748B] mt-0.5">$1 = {naira(c.rate)}</p>
              </div>
              <button type="button" onClick={() => openSell(c)} className="h-9 px-5 rounded-full bg-[#1877F2] text-white text-sm font-semibold shrink-0">Sell</button>
            </div>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="px-4">
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {(["ALL", "PENDING", "SUCCESS", "REJECTED"] as HistFilter[]).map((f) => (
              <button key={f} type="button" onClick={() => setHistFilter(f)} className={`h-9 px-4 rounded-full text-xs font-semibold shrink-0 ${histFilter === f ? "bg-[#0F172A] text-white" : "bg-white border border-[#E2E8F0] text-[#64748B]"}`}>{f}</button>
            ))}
          </div>
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-base font-semibold text-[#0F172A]">Start your first trade</p>
              <p className="text-sm text-[#64748B] mt-1">Sell a gift card today and get your first-trade bonus.</p>
              <button type="button" onClick={() => setTab("home")} className="mt-5 h-11 px-6 rounded-full bg-[#1877F2] text-white text-sm font-semibold">Sell Gift Card</button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrders.map((o) => (
                <div key={o.id} className="bg-white rounded-[14px] border border-[#E2E8F0] px-3.5 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-xs font-bold text-[#1877F2]">GC</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{o.card}</p>
                    <p className="text-[11px] text-[#94A3B8]">ID: {o.id} - {o.when}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#0F172A] tabular-nums">{naira(o.settlement)}</p>
                    <span className={`text-[10px] font-semibold ${o.status === "SUCCESS" ? "text-emerald-600" : o.status === "REJECTED" ? "text-red-500" : "text-amber-600"}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "withdraw" && (
        <div className="px-4">
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5">
            <p className="text-[12px] text-[#64748B]">Total Balance</p>
            <p className="text-2xl font-bold text-[#0F172A] tabular-nums mt-0.5">0.00 <span className="text-sm font-medium text-[#64748B]">ngn</span></p>
            <button type="button" onClick={() => setView("addbank")} className="mt-4 inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-[#1877F2]/30 text-[#1877F2] text-sm font-medium"><Plus size={14} /> Add Bank Card</button>
          </div>
          {savedBanks.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">Saved accounts</p>
              {savedBanks.map((b, i) => (
                <div key={i} className="bg-white rounded-[12px] border border-[#E2E8F0] px-3.5 py-3">
                  <p className="text-sm font-semibold text-[#0F172A]">{b.bank}</p>
                  <p className="text-[12px] text-[#64748B]">{b.acct} - {b.name}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5">
            <p className="text-sm font-semibold text-[#0F172A] mb-2">Recent Transactions</p>
            <p className="text-center text-sm text-[#94A3B8] py-10">There is no withdrawal record</p>
          </div>
          <button type="button" className="fixed bottom-20 left-4 right-4 h-12 rounded-full bg-[#1877F2] text-white text-sm font-semibold shadow-lg">Withdraw</button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
          <button type="button" onClick={() => setTab("home")} className={`flex flex-col items-center gap-0.5 min-w-[64px] ${tab === "home" ? "text-[#1877F2]" : "text-[#64748B]"}`}>
            <Home size={22} strokeWidth={tab === "home" ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium">Sell</span>
          </button>
          <button type="button" onClick={() => setTab("home")} className="w-14 h-14 -mt-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(24,119,242,0.35)]" aria-label="Trade">
            <Sparkles size={24} />
          </button>
          <button type="button" onClick={() => setTab("history")} className={`flex flex-col items-center gap-0.5 min-w-[64px] ${tab === "history" ? "text-[#1877F2]" : "text-[#64748B]"}`}>
            <HistoryIcon size={22} strokeWidth={tab === "history" ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium">History</span>
          </button>
          <button type="button" onClick={() => setTab("withdraw")} className={`flex flex-col items-center gap-0.5 min-w-[64px] ${tab === "withdraw" ? "text-[#1877F2]" : "text-[#64748B]"}`}>
            <Wallet size={22} strokeWidth={tab === "withdraw" ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium">Withdraw</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
