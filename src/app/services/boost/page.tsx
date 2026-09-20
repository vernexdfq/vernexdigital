"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Rocket,
  Search,
  X,
  Info,
  Link2,
  RefreshCw,
  Package,
} from "lucide-react";

/* ── Demo catalog (replace with API later) ───────────────────────── */
const CATEGORIES = [
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "tiktok", name: "TikTok" },
  { id: "youtube", name: "YouTube" },
  { id: "twitter", name: "Twitter / X" },
  { id: "audiomack", name: "Audiomack" },
  { id: "telegram", name: "Telegram" },
  { id: "spotify", name: "Spotify" },
];

type Service = {
  id: string;
  categoryId: string;
  name: string;
  ratePer1000: number;
  min: number;
  max: number;
};

const SERVICES: Service[] = [
  {
    id: "ig-followers",
    categoryId: "instagram",
    name: "Instagram Followers [HQ] [Non Drop]",
    ratePer1000: 1850,
    min: 100,
    max: 500000,
  },
  {
    id: "ig-likes",
    categoryId: "instagram",
    name: "Instagram Likes [Real] [Fast]",
    ratePer1000: 420,
    min: 50,
    max: 100000,
  },
  {
    id: "ig-views",
    categoryId: "instagram",
    name: "Instagram Views [Instant]",
    ratePer1000: 180,
    min: 100,
    max: 1000000,
  },
  {
    id: "fb-page-followers",
    categoryId: "facebook",
    name: "Facebook Page Followers",
    ratePer1000: 2100,
    min: 100,
    max: 200000,
  },
  {
    id: "fb-page-likes",
    categoryId: "facebook",
    name: "Facebook Page Likes",
    ratePer1000: 1950,
    min: 50,
    max: 100000,
  },
  {
    id: "tt-followers",
    categoryId: "tiktok",
    name: "TikTok Followers [Stable]",
    ratePer1000: 2400,
    min: 100,
    max: 300000,
  },
  {
    id: "tt-likes",
    categoryId: "tiktok",
    name: "TikTok Likes [Fast]",
    ratePer1000: 550,
    min: 50,
    max: 500000,
  },
  {
    id: "yt-subs",
    categoryId: "youtube",
    name: "YouTube Subscribers [Real]",
    ratePer1000: 8900,
    min: 50,
    max: 50000,
  },
  {
    id: "yt-views",
    categoryId: "youtube",
    name: "YouTube Views [Retention]",
    ratePer1000: 980,
    min: 500,
    max: 1000000,
  },
  {
    id: "x-followers",
    categoryId: "twitter",
    name: "Twitter / X Followers",
    ratePer1000: 3200,
    min: 100,
    max: 100000,
  },
  {
    id: "am-likes",
    categoryId: "audiomack",
    name: "Audiomack Likes [Worldwide] [Non Drop]",
    ratePer1000: 2122.07,
    min: 100,
    max: 10000000,
  },
  {
    id: "tg-members",
    categoryId: "telegram",
    name: "Telegram Channel Members",
    ratePer1000: 1650,
    min: 100,
    max: 200000,
  },
  {
    id: "sp-plays",
    categoryId: "spotify",
    name: "Spotify Plays",
    ratePer1000: 1100,
    min: 1000,
    max: 500000,
  },
];

const WALLET = 0.27; // demo only — shown in header, not as a card

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── Searchable bottom sheet ─────────────────────────────────────── */
function Sheet({
  title,
  open,
  onClose,
  search,
  onSearch,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  search: string;
  onSearch: (v: string) => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-[20px] max-h-[78vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-base font-semibold text-[#0F172A]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search..."
              className="w-full h-11 pl-9 pr-3 rounded-[12px] border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
              autoFocus
            />
          </div>
        </div>
        <div className="overflow-y-auto px-2 pb-6">{children}</div>
      </div>
    </div>
  );
}

export default function BoostAccountPage() {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");
  const [catOpen, setCatOpen] = useState(false);
  const [svcOpen, setSvcOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [svcSearch, setSvcSearch] = useState("");
  const [orders, setOrders] = useState<
    { id: string; service: string; qty: number; total: number; status: string }[]
  >([]);

  const category = CATEGORIES.find((c) => c.id === categoryId) ?? null;
  const service = SERVICES.find((s) => s.id === serviceId) ?? null;

  const filteredCats = useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [catSearch]);

  const filteredSvcs = useMemo(() => {
    const list = categoryId
      ? SERVICES.filter((s) => s.categoryId === categoryId)
      : SERVICES;
    const q = svcSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => s.name.toLowerCase().includes(q));
  }, [categoryId, svcSearch]);

  const quantity = Number(qty) || 0;
  const total =
    service && quantity > 0 ? (service.ratePer1000 / 1000) * quantity : 0;
  const insufficient = total > 0 && total > WALLET;
  const canOrder =
    !!service &&
    link.trim().length > 5 &&
    quantity >= (service?.min ?? 0) &&
    quantity <= (service?.max ?? 0) &&
    !insufficient;

  function selectCategory(id: string) {
    setCategoryId(id);
    setServiceId(null);
    setCatOpen(false);
    setCatSearch("");
  }

  function selectService(id: string) {
    setServiceId(id);
    setSvcOpen(false);
    setSvcSearch("");
  }

  function placeOrder() {
    if (!canOrder || !service) return;
    setOrders((prev) => [
      {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        service: service.name,
        qty: quantity,
        total,
        status: "Pending",
      },
      ...prev,
    ]);
    setLink("");
    setQty("");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link
            href="/home"
            className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]"
          >
            <ArrowLeft size={18} />
            Back
          </Link>
          <h1 className="text-sm font-semibold text-[#0F172A]">Boost Account</h1>
          <span className="text-sm font-semibold text-[#16A34A] tabular-nums">
            {formatNaira(WALLET)}
          </span>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Hero — clean, not loud */}
        <div className="rounded-[14px] bg-gradient-to-br from-[#0B1220] to-[#152238] p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[12px] bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <Rocket size={22} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white leading-tight">
              Boost Your Account
            </p>
            <p className="text-[12px] text-slate-300 mt-0.5 leading-snug">
              Followers, likes, views & more — delivered fast
            </p>
          </div>
        </div>

        {/* Tip — subtle, not bold */}
        <div className="flex gap-2.5 rounded-[12px] bg-[#EFF6FF] border border-[#BFDBFE] px-3.5 py-3">
          <Info size={16} className="text-[#1877F2] shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#1E3A5F] leading-relaxed">
            Select a category, choose a service, then enter your link and
            quantity.
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
            Category
          </label>
          <button
            type="button"
            onClick={() => setCatOpen(true)}
            className="mt-1.5 w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] flex items-center justify-between text-left active:scale-[0.99] transition"
          >
            <span
              className={`text-sm ${category ? "text-[#0F172A] font-medium" : "text-[#94A3B8]"}`}
            >
              {category ? category.name : "Select a category"}
            </span>
            <span className="text-[#94A3B8] text-xs">▼</span>
          </button>
        </div>

        {/* Service */}
        <div>
          <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
            Service
          </label>
          <button
            type="button"
            onClick={() => setSvcOpen(true)}
            disabled={!categoryId}
            className="mt-1.5 w-full min-h-12 px-3.5 py-2.5 rounded-[12px] bg-white border border-[#E2E8F0] flex items-center justify-between text-left disabled:opacity-50 active:scale-[0.99] transition"
          >
            <span
              className={`text-sm pr-2 ${service ? "text-[#0F172A] font-medium" : "text-[#94A3B8]"}`}
            >
              {service ? service.name : "Select a service"}
            </span>
            <span className="text-[#94A3B8] text-xs shrink-0">▼</span>
          </button>
        </div>

        {/* Details */}
        <div>
          <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
            Details
          </label>
          <div className="mt-1.5 space-y-2.5">
            <div className="relative">
              <Link2
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Paste your post or profile link"
                className="w-full h-12 pl-10 pr-3 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
              />
            </div>
            <div>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                placeholder="Enter quantity"
                className="w-full h-12 px-3.5 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
              />
              {service && (
                <p className="mt-1.5 text-[11px] text-[#94A3B8]">
                  Min: {service.min.toLocaleString()} · Max:{" "}
                  {service.max.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div>
          <label className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
            Order Summary
          </label>
          <div className="mt-1.5 rounded-[14px] bg-white border border-[#E2E8F0] overflow-hidden">
            {service && quantity > 0 ? (
              <>
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B]">Rate per 1,000</span>
                    <span className="font-medium text-[#0F172A] tabular-nums">
                      {formatNaira(service.ratePer1000)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748B]">Min / Max</span>
                    <span className="font-medium text-[#0F172A] tabular-nums">
                      {service.min.toLocaleString()} –{" "}
                      {service.max.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#0B1220] to-[#152238] px-4 py-4">
                  <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                    Total Cost
                  </p>
                  <p className="text-2xl font-semibold text-white tabular-nums mt-1">
                    {formatNaira(total)}
                  </p>
                  {insufficient && (
                    <p className="mt-2 text-[12px] text-red-400 flex items-center gap-1.5">
                      <span>⚠</span> Insufficient wallet balance
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-[12px]">
                    <span className="text-slate-400">Wallet Balance</span>
                    <span className="text-emerald-400 font-medium tabular-nums">
                      {formatNaira(WALLET)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="px-4 py-10 text-center">
                <Package size={28} className="mx-auto text-[#CBD5E1]" />
                <p className="mt-2 text-sm text-[#94A3B8]">
                  Select a service and enter quantity to see price
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Place order */}
        <button
          type="button"
          disabled={!canOrder}
          onClick={placeOrder}
          className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#166FE5] active:scale-[0.99] transition"
        >
          <Rocket size={18} strokeWidth={2} />
          Place Order
        </button>

        {/* My orders */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-semibold text-[#0F172A] flex items-center gap-1.5">
              <RefreshCw size={14} className="text-[#64748B]" />
              My Orders
            </h2>
            <button
              type="button"
              className="text-xs font-medium text-[#1877F2] flex items-center gap-1"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
          </div>
          {orders.length === 0 ? (
            <div className="rounded-[12px] bg-white border border-[#E2E8F0] py-10 text-center">
              <p className="text-sm text-[#94A3B8]">No orders yet</p>
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
                        {o.service}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">
                        {o.id} · Qty {o.qty.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#0F172A] tabular-nums">
                        {formatNaira(o.total)}
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

      {/* Category sheet */}
      <Sheet
        title="Select Category"
        open={catOpen}
        onClose={() => {
          setCatOpen(false);
          setCatSearch("");
        }}
        search={catSearch}
        onSearch={setCatSearch}
      >
        {filteredCats.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => selectCategory(c.id)}
            className={`w-full text-left px-3 py-3.5 rounded-[10px] text-sm flex items-center gap-3 ${
              categoryId === c.id
                ? "bg-[#EFF6FF] text-[#1877F2] font-medium"
                : "text-[#0F172A] hover:bg-[#F8FAFC]"
            }`}
          >
            <span className="w-8 h-8 rounded-[8px] bg-[#F1F5F9] flex items-center justify-center text-xs font-semibold text-[#64748B]">
              {c.name.slice(0, 1)}
            </span>
            {c.name}
          </button>
        ))}
        {filteredCats.length === 0 && (
          <p className="text-center text-sm text-[#94A3B8] py-8">No results</p>
        )}
      </Sheet>

      {/* Service sheet */}
      <Sheet
        title="Select Service"
        open={svcOpen}
        onClose={() => {
          setSvcOpen(false);
          setSvcSearch("");
        }}
        search={svcSearch}
        onSearch={setSvcSearch}
      >
        {filteredSvcs.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => selectService(s.id)}
            className={`w-full text-left px-3 py-3.5 rounded-[10px] ${
              serviceId === s.id ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"
            }`}
          >
            <p
              className={`text-sm leading-snug ${
                serviceId === s.id
                  ? "text-[#1877F2] font-medium"
                  : "text-[#0F172A]"
              }`}
            >
              {s.name}
            </p>
            <p className="text-[11px] text-[#64748B] mt-1 tabular-nums">
              {formatNaira(s.ratePer1000)} per 1,000 · Min {s.min.toLocaleString()}
            </p>
          </button>
        ))}
        {filteredSvcs.length === 0 && (
          <p className="text-center text-sm text-[#94A3B8] py-8">No results</p>
        )}
      </Sheet>
    </div>
  );
}
