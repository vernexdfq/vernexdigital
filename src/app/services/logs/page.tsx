"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  X,
  Zap,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react";

/* ── Demo catalog (swap for provider API later) ──────────────────── */
type LogProduct = {
  id: string;
  platform: string;
  code: string;
  name: string;
  subtitle: string;
  description: string;
  tags: string[];
  age: string;
  stock: number;
  price: number;
  region: string;
  delivery: string;
};

const PRODUCTS: LogProduct[] = [
  {
    id: "ig-aged-2019",
    platform: "Instagram",
    code: "IG",
    name: "Instagram Aged 2019",
    subtitle: "5 yrs · Mixed",
    description:
      "Aged IG account, email access included. Softreg style. Accounts created around 2019 with natural activity history. Full login details and recovery email provided after purchase.",
    tags: ["Email access", "Aged", "Instant delivery"],
    age: "5 yrs",
    stock: 42,
    price: 4500,
    region: "Mixed",
    delivery: "Instant",
  },
  {
    id: "ig-1k-5k",
    platform: "Instagram",
    code: "IG",
    name: "Instagram 1K–5K Followers",
    subtitle: "1–2 yrs · US",
    description:
      "Instagram accounts with 1,000–5,000 real-looking followers. Aged 1–2 years, US-based profiles. Email access included. Suitable for branding and engagement campaigns.",
    tags: ["Followers", "US", "Instant delivery"],
    age: "1–2 yrs",
    stock: 15,
    price: 8900,
    region: "US",
    delivery: "Instant",
  },
  {
    id: "ig-pva",
    platform: "Instagram",
    code: "IG",
    name: "Instagram PVA",
    subtitle: "New · US",
    description:
      "Phone-verified Instagram accounts (PVA). Fresh registration, US numbers used for verification. Email access included. Ready for immediate use.",
    tags: ["PVA", "New", "Instant delivery"],
    age: "New",
    stock: 88,
    price: 3200,
    region: "US",
    delivery: "Instant",
  },
  {
    id: "fb-usa-verified",
    platform: "Facebook",
    code: "FB",
    name: "Facebook USA Verified",
    subtitle: "3 yrs · USA",
    description:
      "USA Facebook accounts, verified profiles aged approximately 3 years. Email access included. Suitable for pages, ads testing, and social activity.",
    tags: ["Verified", "USA", "Instant delivery"],
    age: "3 yrs",
    stock: 18,
    price: 6800,
    region: "USA",
    delivery: "Instant",
  },
  {
    id: "fb-softreg",
    platform: "Facebook",
    code: "FB",
    name: "Facebook Softreg",
    subtitle: "New · Mixed",
    description:
      "Soft-registered Facebook accounts. New profiles with email access. Mixed regions. Instant delivery after successful payment.",
    tags: ["Softreg", "New", "Instant delivery"],
    age: "New",
    stock: 120,
    price: 2100,
    region: "Mixed",
    delivery: "Instant",
  },
  {
    id: "fb-friends",
    platform: "Facebook",
    code: "FB",
    name: "Facebook With Friends",
    subtitle: "6 mo+ · EU",
    description:
      "Facebook accounts with existing friends list. Aged 6 months or more, EU region. Email access included. Natural-looking profiles for engagement.",
    tags: ["Friends", "EU", "Instant delivery"],
    age: "6 mo+",
    stock: 24,
    price: 5500,
    region: "EU",
    delivery: "Instant",
  },
  {
    id: "gm-pva",
    platform: "Gmail",
    code: "GM",
    name: "Gmail PVA + Recovery",
    subtitle: "New · US",
    description:
      "Phone-verified Gmail accounts with recovery email set. Fresh US registrations. Full credentials delivered instantly after purchase.",
    tags: ["PVA", "Recovery", "Instant delivery"],
    age: "New",
    stock: 210,
    price: 1800,
    region: "US",
    delivery: "Instant",
  },
  {
    id: "gm-aged",
    platform: "Gmail",
    code: "GM",
    name: "Gmail Aged 2018–2020",
    subtitle: "4–6 yrs · US",
    description:
      "Aged Gmail accounts created between 2018 and 2020. US region. Email access and recovery details included. Strong trust score for platform registrations.",
    tags: ["Aged", "US", "Instant delivery"],
    age: "4–6 yrs",
    stock: 64,
    price: 3500,
    region: "US",
    delivery: "Instant",
  },
  {
    id: "tt-aged",
    platform: "TikTok",
    code: "TT",
    name: "TikTok Aged Accounts",
    subtitle: "1 yr+ · Mixed",
    description:
      "Aged TikTok accounts with activity history. Mixed regions. Email access included. Suitable for content and engagement use cases.",
    tags: ["Aged", "Instant delivery"],
    age: "1 yr+",
    stock: 31,
    price: 4800,
    region: "Mixed",
    delivery: "Instant",
  },
  {
    id: "tg-aged",
    platform: "Telegram",
    code: "TG",
    name: "Telegram Aged Numbers",
    subtitle: "1 yr+ · Mixed",
    description:
      "Aged Telegram accounts linked to numbers. Mixed regions. Session or credentials delivered per provider format. Instant after payment confirmation.",
    tags: ["Aged", "Instant delivery"],
    age: "1 yr+",
    stock: 33,
    price: 4200,
    region: "Mixed",
    delivery: "Instant",
  },
  {
    id: "dc-aged",
    platform: "Discord",
    code: "DC",
    name: "Discord Aged Accounts",
    subtitle: "2 yrs · US",
    description:
      "Aged Discord accounts approximately 2 years old. US region. Full access credentials included. Ready for server and community use.",
    tags: ["Aged", "US", "Instant delivery"],
    age: "2 yrs",
    stock: 45,
    price: 2900,
    region: "US",
    delivery: "Instant",
  },
  {
    id: "sc-pva",
    platform: "Snapchat",
    code: "SC",
    name: "Snapchat PVA",
    subtitle: "New · US",
    description:
      "Phone-verified Snapchat accounts. New US registrations. Login details delivered instantly after successful order.",
    tags: ["PVA", "New", "Instant delivery"],
    age: "New",
    stock: 22,
    price: 3500,
    region: "US",
    delivery: "Instant",
  },
  {
    id: "yt-channel",
    platform: "YouTube",
    code: "YT",
    name: "YouTube Aged Channel",
    subtitle: "3 yrs · US",
    description:
      "Aged YouTube channels approximately 3 years old. US-based. Channel and login access included as provided by the API supplier.",
    tags: ["Aged", "US", "Instant delivery"],
    age: "3 yrs",
    stock: 8,
    price: 12000,
    region: "US",
    delivery: "Instant",
  },
  {
    id: "rd-aged",
    platform: "Reddit",
    code: "RD",
    name: "Reddit Aged Accounts",
    subtitle: "2 yrs · US",
    description:
      "Aged Reddit accounts about 2 years old. US region. Karma and history vary per account. Credentials delivered after purchase.",
    tags: ["Aged", "US", "Instant delivery"],
    age: "2 yrs",
    stock: 19,
    price: 4100,
    region: "US",
    delivery: "Instant",
  },
];

const FILTERS = [
  "All",
  "Instagram",
  "Facebook",
  "TikTok",
  "Gmail",
  "Telegram",
  "Discord",
  "Snapchat",
  "YouTube",
  "Reddit",
];

const CODE_COLORS: Record<string, string> = {
  IG: "bg-purple-100 text-purple-700",
  FB: "bg-blue-100 text-blue-700",
  TT: "bg-slate-900 text-white",
  GM: "bg-amber-100 text-amber-800",
  TG: "bg-sky-100 text-sky-700",
  DC: "bg-indigo-100 text-indigo-700",
  SC: "bg-yellow-100 text-yellow-800",
  YT: "bg-red-100 text-red-700",
  RD: "bg-orange-100 text-orange-700",
};

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function BuyLogsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<LogProduct | null>(null);
  const [qty, setQty] = useState(1);

  /* Lock background scroll while sheet is open */
  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  const list = useMemo(() => {
    let items = PRODUCTS;
    if (filter !== "All") {
      items = items.filter((p) => p.platform === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.platform.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q)
      );
    }
    return items;
  }, [filter, query]);

  function openProduct(p: LogProduct) {
    setSelected(p);
    setQty(1);
  }

  function closeProduct() {
    setSelected(null);
    setQty(1);
  }

  const total = selected ? selected.price * qty : 0;

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
          </Link>
          <h1 className="text-sm font-semibold text-[#0F172A]">Buy Logs</h1>
          <button
            type="button"
            className="text-xs font-medium text-[#1877F2] flex items-center gap-1"
          >
            Orders
            <RefreshCw size={12} className="text-[#94A3B8]" />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* Hero */}
        <div className="rounded-[14px] bg-gradient-to-br from-[#1877F2] to-[#0D5FBF] p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute right-8 bottom-0 w-16 h-16 rounded-full bg-white/10" />
          <p className="text-[10px] font-semibold tracking-widest text-blue-100 uppercase">
            Marketplace
          </p>
          <p className="text-lg font-semibold text-white mt-1">Buy Accounts</p>
          <p className="text-[12px] text-blue-100 mt-1 leading-snug max-w-[85%]">
            Aged & verified social media accounts — delivered instantly.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts..."
            className="w-full h-11 pl-10 pr-3 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 h-8 px-3.5 rounded-full text-xs font-medium transition ${
                filter === f
                  ? "bg-[#1877F2] text-white"
                  : "bg-white border border-[#E2E8F0] text-[#475569]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        {list.length === 0 ? (
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] py-16 text-center">
            <p className="text-sm text-[#94A3B8]">No accounts match your search</p>
            <p className="text-[12px] text-[#CBD5E1] mt-1">
              Stock comes from the provider API
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => openProduct(p)}
                className="text-left rounded-[14px] bg-white border border-[#E2E8F0] p-3 flex flex-col active:scale-[0.98] transition"
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`w-8 h-8 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      CODE_COLORS[p.code] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {p.code}
                  </span>
                  <span className="text-[10px] text-[#64748B]">
                    {p.stock} in stock
                  </span>
                </div>
                <p className="mt-2.5 text-[13px] font-semibold text-[#0F172A] leading-snug line-clamp-2">
                  {p.name}
                </p>
                <p className="mt-1 text-[11px] text-[#94A3B8]">{p.subtitle}</p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-[#16A34A]">
                  <Zap size={11} />
                  {p.delivery}
                </div>
                <p className="mt-2 text-[15px] font-semibold text-[#0F172A] tabular-nums">
                  {formatNaira(p.price)}
                </p>
                <span className="mt-2.5 w-full h-9 rounded-[10px] bg-[#1877F2] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5">
                  <ShoppingCart size={14} />
                  Buy Now
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product details sheet — independent scroll, locked background, sticky Buy */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop — blocks scroll on the page behind */}
          <button
            type="button"
            className="absolute inset-0 bg-black/40 touch-none"
            aria-label="Close"
            onClick={closeProduct}
          />

          {/* Sheet panel */}
          <div className="relative z-10 flex flex-col bg-white rounded-t-[20px] max-h-[90vh] shadow-xl overflow-hidden">
            {/* Sticky header */}
            <div className="shrink-0 bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#0F172A]">
                Product details
              </h3>
              <button
                type="button"
                onClick={closeProduct}
                className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body only */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-4 space-y-4">
              <div className="flex items-start gap-3">
                <span
                  className={`w-11 h-11 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${
                    CODE_COLORS[selected.code] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {selected.code}
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-[#0F172A]">
                    {selected.name}
                  </p>
                  <p className="text-[12px] text-[#64748B] mt-0.5">
                    {selected.platform} · {selected.age} · {selected.region}
                  </p>
                </div>
              </div>

              {/* Full provider description — never truncated */}
              <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">
                {selected.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {selected.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569]"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2.5">
                  <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                    Age
                  </p>
                  <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                    {selected.age}
                  </p>
                </div>
                <div className="rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2.5">
                  <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                    Stock
                  </p>
                  <p className="text-sm font-semibold text-[#0F172A] mt-0.5">
                    {selected.stock}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wide text-[#64748B] uppercase">
                  Quantity
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-[10px] border border-[#E2E8F0] bg-white flex items-center justify-center text-[#0F172A]"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQty((q) => Math.min(selected.stock, q + 1))
                    }
                    className="w-9 h-9 rounded-[10px] border border-[#E2E8F0] bg-white flex items-center justify-center text-[#0F172A]"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                    Total
                  </p>
                  <p className="text-xl font-semibold text-[#1877F2] tabular-nums">
                    {formatNaira(total)}
                  </p>
                </div>
                <span className="text-[12px] text-[#16A34A] flex items-center gap-1">
                  <Zap size={12} />
                  Instant delivery
                </span>
              </div>
            </div>

            {/* Sticky footer — always visible Buy button */}
            <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#166FE5] active:scale-[0.99] transition"
              >
                <ShoppingCart size={18} />
                Buy Now · {formatNaira(total)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
