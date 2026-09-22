"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Search,
  X,
  ChevronRight,
  Plus,
  History as HistoryIcon,
  Wallet,
  Sparkles,
} from "lucide-react";

type GiftCard = {
  id: string;
  name: string;
  domain: string;
  rate: number;
  color: string;
  physical?: boolean;
  egift?: boolean;
};

const CARDS: GiftCard[] = [
  { id: "apple", name: "iTunes (Apple)", domain: "apple.com", rate: 1334.45, color: "#555555", physical: true, egift: true },
  { id: "razer", name: "Razer", domain: "razer.com", rate: 1170.21, color: "#44D62C", physical: true, egift: true },
  { id: "steam", name: "Steam", domain: "steampowered.com", rate: 1334.45, color: "#1B2838", physical: true, egift: true },
  { id: "xbox", name: "Xbox", domain: "xbox.com", rate: 1262.6, color: "#107C10", physical: true, egift: true },
  { id: "amazon", name: "Amazon", domain: "amazon.com", rate: 1040, color: "#FF9900", physical: true, egift: true },
  { id: "google", name: "Google Play", domain: "play.google.com", rate: 964.91, color: "#34A853", egift: true },
  { id: "roblox", name: "Roblox", domain: "roblox.com", rate: 821.2, color: "#E2231A", physical: true, egift: true },
  { id: "playstation", name: "PlayStation", domain: "playstation.com", rate: 882.79, color: "#003791", physical: true, egift: true },
];

const BANKS = [
  { id: "opay", name: "OPay", color: "#1DCC70" },
  { id: "moniepoint", name: "Moniepoint", color: "#0066FF" },
  { id: "kuda", name: "Kuda MFB", color: "#40196D" },
  { id: "gtb", name: "GTBank", color: "#E35424" },
  { id: "access", name: "Access Bank", color: "#F7941D" },
];

const TRADES = [
  { user: "T****M", card: "Razer AUD 325*1", naira: 258882 },
  { user: "W****h", card: "iTunes IT 100*3", naira: 301791 },
  { user: "2****P", card: "iTunes USD 350*2", naira: 689808 },
];

type Tab = "home" | "history" | "withdraw";
type HistFilter = "ALL" | "PENDING" | "SUCCESS" | "REJECTED";
type Entry = { face: string; qty: string; code: string };

function naira(n: number) {
  return "\u20a6" + n.toLocaleString("en-NG", { maximumFractionDigits: 2 });
}

function logoUrl(domain: string) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function Logo({
  domain,
  name,
  color,
  size = 40,
}: {
  domain: string;
  name: string;
  color: string;
  size?: number;
}) {
  const [fail, setFail] = useState(false);
  if (fail) {
    return (
      <div
        className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
        style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <div
      className="rounded-full overflow-hidden bg-white border border-[#E2E8F0] shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl(domain)}
        alt={name}
        width={size}
        height={size}
        className="w-full h-full object-contain p-1.5"
        onError={() => setFail(true)}
        referrerPolicy="no-referrer"
      />
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
  const [orders, setOrders] = useState<
    { id: string; card: string; settlement: number; status: HistFilter; when: string }[]
  >([]);
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
    setOrders((prev) => [
      {
        id: "GC-" + Date.now().toString().slice(-6),
        card: selected.name,
        settlement: earn,
        status: "PENDING",
        when: "Just now",
      },
      ...prev,
    ]);
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
      <div className="min-h-screen bg-[#F0F7FF] pb-28 overflow-y-auto">
        <header className="sticky top-0 z-30 bg-gradient-to-b from-[#E8F1FF] to-[#F0F7FF] px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setView("list")} className="w-9 h-9 flex items-center justify-center text-[#0F172A]">
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-lg font-semibold text-[#0F172A]">Sell Gift Cards</h1>
          </div>
        </header>
        <div className="px-4 space-y-3 pb-8">
          <button type="button" onClick={() => setView("list")} className="w-full bg-white rounded-[14px] border border-[#E2E8F0] px-4 py-3.5 flex items-center gap-3">
            <Logo domain={selected.domain} name={selected.name} color={selected.color} size={36} />
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
          </div>
          {entries.map((entry, i) => (
            <div key={i} className="bg-white rounded-[14px] border border-[#E2E8F0] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#0F172A]">Card {i + 1}</p>
                {i > 0 && (<button type="button" onClick={() => setEntries((e) => e.filter((_, j) => j !== i))} className="text-[#94A3B8]"><X size={16} /></button>)}
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
            </div>
          ))}
          <button type="button" onClick={() => setEntries((e) => [...e, { face: "", qty: "1", code: "" }])} className="w-full h-11 rounded-[12px] border border-dashed border-[#1877F2]/40 text-[#1877F2] text-sm font-medium">+ Send More Cards</button>
          <div className="flex items-center justify-between pt-2 pb-6">
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
      <div className="min-h-screen bg-[#F8FAFC] pb-28 overflow-y-auto">
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold">Select Bank</h3>
                  <button type="button" onClick={() => setBankOpen(false)}><X size={18} /></button>
                </div>
                <input value={bankQ} onChange={(e) => setBankQ(e.target.value)} placeholder="Search bank" className="w-full h-10 px-3 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-sm" />
              </div>
              <div className="overflow-y-auto px-2 pb-8">
                {filteredBanks.map((b) => (
                  <button key={b.id} type="button" onClick={() => { setBank(b); setBankOpen(false); setBankQ(""); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-[12px] text-left hover:bg-[#F8FAFC]">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: b.color }}>{b.name.charAt(0)}</div>
                    <span className="text-sm font-medium text-[#0F172A]">{b.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {confirmBank && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setConfirmBank(false)} />
            <div className="relative bg-white rounded-[16px] p-5 w-full max-w-sm space-y-3">
              <h3 className="text-base font-semibold text-[#0F172A]">Confirm Bank Details</h3>
              <p className="text-sm text-[#64748B]">{bank?.name}</p>
              <p className="text-sm font-medium">{acct}</p>
              <p className="text-sm font-semibold text-[#0F172A]">{acctName}</p>
              <button type="button" onClick={saveBank} className="w-full h-11 rounded-full bg-[#1877F2] text-white text-sm font-semibold">Confirm</button>
              <button type="button" onClick={() => setConfirmBank(false)} className="w-full h-10 text-sm text-[#64748B]">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F7FF] to-white pb-24 overflow-y-auto">
      <div className="px-4 pt-3">
        <div className="bg-white/80 border border-[#BFDBFE] rounded-full px-4 py-2 flex items-center gap-2 overflow-hidden">
          <span className="text-[11px] font-semibold text-[#1877F2] shrink-0">LIVE</span>
          <p className="text-[12px] text-[#0F172A] truncate">{trade.user} sold {trade.card} · {naira(trade.naira)}</p>
        </div>
      </div>

      <header className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1877F2]">Vernex Digital</p>
            <h1 className="text-xl font-bold text-[#0F172A]">Sell Gift Cards</h1>
          </div>
        </div>
        <div className="mt-3 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search gift cards"
            className="w-full h-11 pl-9 pr-3 rounded-full bg-white border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#1877F2]"
          />
        </div>
      </header>

      {tab === "home" && (
        <div className="px-4 mt-3 grid grid-cols-2 gap-3 pb-4">
          {filteredCards.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openSell(c)}
              className="bg-white rounded-[14px] border border-[#E2E8F0] p-3.5 text-left active:scale-[0.98] transition shadow-sm"
            >
              <Logo domain={c.domain} name={c.name} color={c.color} size={40} />
              <p className="mt-2.5 text-[13px] font-semibold text-[#0F172A] leading-tight">{c.name}</p>
              <p className="mt-1 text-[11px] text-[#1877F2] font-medium">1$ = {naira(c.rate)}</p>
            </button>
          ))}
        </div>
      )}

      {tab === "history" && (
        <div className="px-4 mt-4 pb-24">
          <div className="flex gap-2 overflow-x-auto pb-3">
            {(["ALL", "PENDING", "SUCCESS", "REJECTED"] as HistFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setHistFilter(f)}
                className={`h-8 px-3 rounded-full text-[11px] font-semibold shrink-0 ${
                  histFilter === f ? "bg-[#1877F2] text-white" : "bg-white border border-[#E2E8F0] text-[#64748B]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {filteredOrders.length === 0 ? (
            <p className="text-center text-sm text-[#94A3B8] py-16">No orders yet</p>
          ) : (
            <div className="space-y-2.5">
              {filteredOrders.map((o) => (
                <div key={o.id} className="bg-white rounded-[12px] border border-[#E2E8F0] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{o.card}</p>
                    <p className="text-[11px] text-[#94A3B8] mt-0.5">{o.when} · {o.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1877F2] tabular-nums">{naira(o.settlement)}</p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${
                      o.status === "SUCCESS" ? "text-emerald-600" : o.status === "REJECTED" ? "text-red-500" : "text-amber-600"
                    }`}>{o.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "withdraw" && (
        <div className="px-4 mt-4 pb-24">
          {savedBanks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[#64748B] mb-4">No bank account added yet</p>
              <button type="button" onClick={() => setView("addbank")} className="h-10 px-5 rounded-full bg-[#1877F2] text-white text-sm font-semibold">Add Bank</button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedBanks.map((b, i) => (
                <div key={i} className="bg-white rounded-[12px] border border-[#E2E8F0] p-4">
                  <p className="text-sm font-semibold text-[#0F172A]">{b.bank}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">{b.acct} · {b.name}</p>
                </div>
              ))}
              <button type="button" onClick={() => setView("addbank")} className="w-full h-10 rounded-[12px] border border-dashed border-[#1877F2]/40 text-[#1877F2] text-sm font-medium">+ Add another bank</button>
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
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-6">
          <button
            type="button"
            onClick={() => setTab("home")}
            className="w-14 h-14 -mt-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(24,119,242,0.35)]"
            aria-label="Sell"
          >
            <Sparkles size={24} />
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`flex flex-col items-center gap-0.5 min-w-[72px] ${tab === "history" ? "text-[#1877F2]" : "text-[#64748B]"}`}
          >
            <HistoryIcon size={22} strokeWidth={tab === "history" ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium">History</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("withdraw")}
            className={`flex flex-col items-center gap-0.5 min-w-[72px] ${tab === "withdraw" ? "text-[#1877F2]" : "text-[#64748B]"}`}
          >
            <Wallet size={22} strokeWidth={tab === "withdraw" ? 2.2 : 1.8} />
            <span className="text-[10px] font-medium">Withdraw</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
