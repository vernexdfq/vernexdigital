"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/useUser";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  X,
  Zap,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Check,
  Copy,
  CircleAlert,
  Package,
} from "lucide-react";

type LogOffer = {
  providerListingId: number;
  platform: string;
  subtype: string;
  subtypeId: number | null;
  title: string;
  description: string;
  stock: number;
  maxQuantity: number;
  wholesaleNgn: number;
  priceNgn: number;
};

type PlacedOrder = {
  id: string;
  title: string;
  platform: string;
  quantity: number;
  unitPriceNgn: number;
  totalNgn: number;
  credentials: string[];
};

type HistoryOrder = PlacedOrder & { status: string; reference: string; createdAt: string | null };

const PLATFORMS = [
  "Facebook", "Instagram", "TikTok", "X / Twitter", "Telegram", "Gmail", "YouTube",
  "Threads", "WhatsApp", "Mobile Proxies", "Google Voice", "Odnoklassniki", "LinkedIn",
  "Reddit", "Indeed", "Truth Social", "AI Accounts", "Google Ads", "Bluesky", "Snapchat",
  "Discord", "Twitch", "Trustpilot", "Quora", "Dating Apps", "Grindr", "eHarmony", "Badoo",
  "Gaming", "Premium Subscriptions", "Mastercard", "Apple", "E-Commerce", "Spotify", "VPN",
  "Netflix", "Pinterest", "Yahoo", "CapCut", "Phone & Messaging", "Roblox", "GitHub", "Outlook",
];

const PLATFORM_ICONS: Record<string, { slug: string; color: string; bg: string }> = {
  Instagram: { slug: "instagram", color: "E4405F", bg: "bg-[#FCE7F3]" },
  Facebook: { slug: "facebook", color: "1877F2", bg: "bg-[#E7F0FF]" },
  TikTok: { slug: "tiktok", color: "000000", bg: "bg-[#F1F5F9]" },
  Gmail: { slug: "gmail", color: "EA4335", bg: "bg-[#FEE2E2]" },
  Telegram: { slug: "telegram", color: "26A5E4", bg: "bg-[#E0F2FE]" },
  Discord: { slug: "discord", color: "5865F2", bg: "bg-[#EEF0FF]" },
  Snapchat: { slug: "snapchat", color: "FFFC00", bg: "bg-[#FEF9C3]" },
  YouTube: { slug: "youtube", color: "FF0000", bg: "bg-[#FEE2E2]" },
  Reddit: { slug: "reddit", color: "FF4500", bg: "bg-[#FFEDD5]" },
  Twitter: { slug: "x", color: "000000", bg: "bg-[#F1F5F9]" },
  "X / Twitter": { slug: "x", color: "000000", bg: "bg-[#F1F5F9]" },
  WhatsApp: { slug: "whatsapp", color: "25D366", bg: "bg-[#DCFCE7]" },
  LinkedIn: { slug: "linkedin", color: "0A66C2", bg: "bg-[#E0F2FE]" },
  Pinterest: { slug: "pinterest", color: "BD081C", bg: "bg-[#FEE2E2]" },
  Twitch: { slug: "twitch", color: "9146FF", bg: "bg-[#F3E8FF]" },
  Spotify: { slug: "spotify", color: "1DB954", bg: "bg-[#DCFCE7]" },
  Netflix: { slug: "netflix", color: "E50914", bg: "bg-[#FEE2E2]" },
};

function platformIconMeta(platform: string) {
  const key = Object.keys(PLATFORM_ICONS).find(
    (k) => k.toLowerCase() === platform.toLowerCase()
  );
  if (key) return PLATFORM_ICONS[key];
  const slug = platform.toLowerCase().replace(/[^a-z0-9]/g, "");
  return { slug, color: "64748B", bg: "bg-[#F1F5F9]" };
}

function PlatformIcon({
  platform,
  size = 20,
  className = "",
}: {
  platform: string;
  size?: number;
  className?: string;
}) {
  const meta = platformIconMeta(platform);
  const src = `https://cdn.simpleicons.org/${meta.slug}/${meta.color}`;
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-[10px] ${meta.bg} ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={platform}
        width={size}
        height={size}
        className="object-contain"
        loading="lazy"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          const parent = el.parentElement;
          if (parent && !parent.querySelector("[data-fallback]")) {
            const span = document.createElement("span");
            span.dataset.fallback = "1";
            span.className = "text-[11px] font-bold text-[#64748B]";
            span.textContent = platform.slice(0, 2).toUpperCase();
            parent.appendChild(span);
          }
        }}
      />
    </span>
  );
}

type CatalogSubtype = {
  id: number;
  name: string;
  count: number;
  stock: number;
};

function subtypeRowClass(selected: boolean) {
  return `w-full flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 border text-left transition ${
    selected
      ? "bg-[#F0F7FF] border-[#1877F2] text-[#0F172A]"
      : "border-[#E2E8F0] text-[#475569]"
  }`;
}

function formatNaira(n: number) {
  return `\u20a6${(Number.isFinite(n) ? n : 0).toLocaleString("en-NG")}`;
}

export default function BuyLogsPage() {
  const { wallet, refresh: refreshUser } = useUser();
  const balance = wallet.balance;
  const [platform, setPlatform] = useState("Facebook");
  const [offers, setOffers] = useState<LogOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [query, setQuery] = useState("");
  const [subtypes, setSubtypes] = useState<CatalogSubtype[]>([]);
  const [subtypeId, setSubtypeId] = useState<number | null>(null);
  const [selected, setSelected] = useState<LogOffer | null>(null);
  const [qty, setQty] = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const loadOffers = useCallback(async (p: string, silent = false) => {
    if (!silent) { setLoading(true); setCatalogError(""); }
    try {
      const res = await fetch(`/api/logs/catalog?platform=${encodeURIComponent(p)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || "Could not load the live catalogue.");
      setOffers((Array.isArray(data.offers) ? data.offers : []) as LogOffer[]);
      setSubtypes((Array.isArray(data.subtypes) ? data.subtypes : []) as CatalogSubtype[]);
      setSubtypeId(null);
    } catch (e) {
      setCatalogError(e instanceof Error ? e.message : "Catalog error");
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOffers(platform);
  }, [platform, loadOffers]);

  useEffect(() => {
    if (!selected && !ordersOpen) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [selected, ordersOpen]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return offers.filter((p) => {
      if (subtypeId !== null && p.subtypeId !== subtypeId) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.platform.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [offers, query, subtypeId]);

  const total = selected ? selected.priceNgn * qty : 0;
  const shortfall = total > balance ? total - balance : 0;

  function openProduct(p: LogOffer) {
    setSelected(p);
    setQty(1);
    setBuyError("");
    setPlaced(null);
    setCopiedIdx(null);
  }

  function closeProduct() {
    setSelected(null);
    setQty(1);
    setBuyError("");
    setPlaced(null);
  }

  async function checkout() {
    if (!selected || ordering) return;
    setOrdering(true);
    setBuyError("");
    try {
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Sign in to complete your purchase.");
      const res = await fetch("/api/logs/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform: selected.platform, providerListingId: selected.providerListingId, quantity: qty }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.ok === false) throw new Error(result.error || "Purchase failed. Please retry.");
      const order = result.order as PlacedOrder;
      setPlaced(order);
      try { await refreshUser(); } catch { /* wallet refresh is non-critical */ }
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setOrdering(false);
    }
  }

  async function copyCredential(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      window.setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function loadOrders() {
    setOrdersOpen(true);
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const supabase = createBrowserClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) throw new Error("Sign in to view your orders.");
      const res = await fetch("/api/logs/orders", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.ok === false) throw new Error(payload.error || "Could not load your orders.");
      setOrders((Array.isArray(payload.orders) ? payload.orders : []) as HistoryOrder[]);
    } catch (e) {
      setOrdersError(e instanceof Error ? e.message : "Could not load your orders.");
    } finally {
      setOrdersLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-semibold text-[#0F172A]">Buy Logs</h1>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="text-xs font-medium text-[#1877F2] flex items-center gap-1"
          >
            Orders
            <RefreshCw size={12} className="text-[#94A3B8]" />
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-[14px] bg-gradient-to-br from-[#1877F2] to-[#0D5FBF] p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute right-8 bottom-0 w-16 h-16 rounded-full bg-white/10" />
          <p className="text-[10px] font-semibold tracking-widest text-blue-100 uppercase">
            Marketplace
          </p>
          <p className="text-lg font-semibold text-white mt-1">Buy Accounts</p>
          <p className="text-[12px] text-blue-100 mt-1 leading-snug max-w-[85%]">
            Live catalog · {PLATFORMS.length} platforms · instant delivery from Verxor.
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts in this platform..."
            className="w-full h-11 pl-10 pr-3 rounded-full border border-[#E2E8F0] bg-white text-sm text-[#0F172A] outline-none focus:border-[#1877F2]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {PLATFORMS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setPlatform(f)}
              className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium transition inline-flex items-center gap-1.5 ${
                platform === f
                  ? "bg-[#1877F2] text-white"
                  : "bg-white border border-[#E2E8F0] text-[#475569]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://cdn.simpleicons.org/${platformIconMeta(f).slug}/${platform === f ? "ffffff" : platformIconMeta(f).color}`}
                alt=""
                width={14}
                height={14}
                className="object-contain"
                loading="lazy"
              />
              {f}
            </button>
          ))}
        </div>

        {loading && (
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-6 text-center text-sm text-[#64748B] flex items-center justify-center gap-2">
            <RefreshCw size={15} className="animate-spin" />
            Loading live {platform} catalog...
          </div>
        )}

        {!loading && !catalogError && subtypes.length > 0 && (
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-3">
            <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-2">
              Filter listings by type
            </p>
            <div className="max-h-52 overflow-y-auto space-y-1">
              <button
                type="button"
                onClick={() => setSubtypeId(null)}
                className={subtypeRowClass(subtypeId === null)}
              >
                <span className="text-[12px] font-semibold">{`All ${platform}`}</span>
                <span className="text-[10px] text-[#94A3B8] shrink-0">{offers.length} listings</span>
              </button>
              {subtypes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSubtypeId(s.id)}
                  className={subtypeRowClass(subtypeId === s.id)}
                >
                  <span className="text-[12px] font-medium truncate">{s.name}</span>
                  <span className="text-[10px] text-[#94A3B8] shrink-0">
                    {s.count} listings · {s.stock} in stock
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && catalogError && (
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-6 text-center">
            <CircleAlert size={18} className="mx-auto text-[#DC2626]" />
            <p className="text-sm font-medium text-[#0F172A] mt-2">{catalogError}</p>
            <button
              type="button"
              onClick={() => void loadOffers(platform)}
              className="mt-3 h-9 px-4 rounded-full bg-[#1877F2] text-white text-xs font-semibold"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !catalogError && list.length === 0 && (
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] p-8 text-center">
            <p className="text-sm font-medium text-[#0F172A]">No accounts found</p>
            <p className="text-xs text-[#94A3B8] mt-1">Try another platform or check back shortly</p>
          </div>
        )}

        {!loading && !catalogError && list.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => (
              <button
                key={p.providerListingId}
                type="button"
                onClick={() => openProduct(p)}
                className="text-left rounded-[14px] bg-white border border-[#E2E8F0] p-3 flex flex-col active:scale-[0.98] transition"
              >
                <div className="flex items-center justify-between gap-1">
                  <PlatformIcon platform={p.platform} size={18} />
                  <span className="text-[10px] text-[#64748B]">{p.stock} in stock</span>
                </div>
                <p className="mt-2.5 text-[13px] font-semibold text-[#0F172A] leading-snug line-clamp-2">
                  {p.title}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-[#16A34A]">
                  <Zap size={11} />
                  Instant
                </div>
                <p className="mt-2 text-[15px] font-bold text-[#0F172A] tabular-nums">
                  {formatNaira(p.priceNgn)}
                </p>
                <span className="mt-2.5 h-9 rounded-[10px] bg-[#1877F2] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5">
                  <ShoppingCart size={14} />
                  Buy Now
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[80] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={closeProduct}
            aria-label="Close"
          />
          <div
            className="relative z-10 flex flex-col w-full max-h-[92vh] bg-white rounded-t-[20px] shadow-2xl overflow-hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="shrink-0 flex items-start gap-3 px-4 pt-4 pb-3 border-b border-[#E2E8F0]">
              <PlatformIcon platform={selected.platform} size={22} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                  {selected.platform}
                </p>
                <h3 className="text-[15px] font-semibold text-[#0F172A] leading-snug">
                  {selected.title}
                </h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  {selected.stock} available · max {selected.maxQuantity} per order
                </p>
              </div>
              <button
                type="button"
                onClick={closeProduct}
                className="w-9 h-9 flex items-center justify-center text-[#64748B]"
              >
                <X size={18} />
              </button>
            </div>

            {placed ? (
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                <div className="rounded-[12px] bg-[#F0FDF4] border border-[#BBF7D0] p-3 flex items-center gap-2">
                  <Check size={16} className="text-[#16A34A]" />
                  <p className="text-[12px] font-medium text-[#166534]">
                    Purchase successful · {placed.quantity} delivered · {formatNaira(placed.totalNgn)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-2">
                    Your credentials ({placed.credentials.length})
                  </p>
                  <div className="space-y-2">
                    {placed.credentials.map((cred, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => void copyCredential(cred, idx)}
                        className="w-full flex items-center gap-2 text-left rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2.5 active:scale-[0.99] transition"
                      >
                        <span className="text-[11px] text-[#94A3B8] tabular-nums">{idx + 1}.</span>
                        <span className="flex-1 text-[12px] font-mono text-[#0F172A] break-all">
                          {cred}
                        </span>
                        {copiedIdx === idx ? (
                          <Check size={14} className="text-[#16A34A] shrink-0" />
                        ) : (
                          <Copy size={14} className="text-[#94A3B8] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Saved to your order history. Secure each account immediately after first login.
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                  {selected.description && (
                    <p className="text-[13px] text-[#475569] leading-relaxed">
                      {selected.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[10px] font-medium text-[#64748B]">
                      {selected.platform}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[10px] font-medium text-[#64748B]">
                      Instant delivery
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-[#0F172A]">Quantity</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-[10px] border border-[#E2E8F0] bg-white flex items-center justify-center text-[#0F172A]"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQty((q) => Math.min(Math.min(10, selected.stock), q + 1))
                        }
                        className="w-9 h-9 rounded-[10px] border border-[#E2E8F0] bg-white flex items-center justify-center text-[#0F172A]"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed pb-2">
                    Credentials are never shown in the catalog. Delivery happens only after a
                    successful wallet debit and provider confirmation.
                  </p>
                </div>

                <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-3">
                  {buyError && (
                    <p className="text-[12px] text-[#DC2626] mb-2 leading-snug">{buyError}</p>
                  )}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-[11px] text-[#94A3B8]">
                        {formatNaira(selected.priceNgn)} each · {selected.stock} available
                      </p>
                      <p className="text-xl font-semibold text-[#0F172A] tabular-nums">
                        {formatNaira(total)}
                      </p>
                    </div>
                    <span className="text-[12px] text-[#16A34A] flex items-center gap-1 mb-1">
                      <Zap size={12} />
                      Instant delivery
                    </span>
                  </div>
                  {shortfall > 0 ? (
                    <Link
                      href="/fund"
                      className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      Add {formatNaira(shortfall)} to continue
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void checkout()}
                      disabled={ordering}
                      className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-60"
                    >
                      <ShieldCheck size={18} />
                      {ordering ? "Processing purchase..." : `Continue to checkout · ${formatNaira(total)}`}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {ordersOpen && (
        <div className="fixed inset-0 z-[90] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOrdersOpen(false)}
            aria-label="Close orders"
          />
          <div
            className="relative z-10 flex flex-col w-full max-h-[88vh] bg-white rounded-t-[20px] shadow-2xl overflow-hidden"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#E2E8F0]">
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-[#94A3B8] uppercase">
                  Activity
                </p>
                <h3 className="text-[15px] font-semibold text-[#0F172A]">Your orders</h3>
              </div>
              <button
                type="button"
                onClick={() => setOrdersOpen(false)}
                className="w-9 h-9 flex items-center justify-center text-[#64748B]"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {ordersLoading && (
                <p className="text-sm text-[#64748B] flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin" /> Loading your orders...
                </p>
              )}
              {ordersError && (
                <p className="text-sm text-[#DC2626]">{ordersError}</p>
              )}
              {!ordersLoading && !ordersError && orders.length === 0 && (
                <div className="text-center py-6">
                  <Package size={22} className="mx-auto text-[#94A3B8]" />
                  <p className="text-sm text-[#64748B] mt-2">
                    No orders yet. Your purchases will appear here.
                  </p>
                </div>
              )}
              {!ordersLoading && orders.map((o) => (
                <div key={o.id} className="rounded-[12px] border border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#0F172A] truncate">{o.title}</p>
                      <p className="text-[11px] text-[#94A3B8]">
                        {o.platform} · {o.quantity} · {formatNaira(o.totalNgn)}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[10px] font-medium text-[#166534]">
                      {o.status}
                    </span>
                  </div>
                  {o.credentials.length > 0 && (
                    <button
                      type="button"
                      onClick={() => void copyCredential(o.credentials.join("\n"), -1)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 h-8 rounded-[10px] bg-[#F1F5F9] text-[11px] font-medium text-[#0F172A]"
                    >
                      <Copy size={12} /> Copy all {o.credentials.length} credentials
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
