"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Gamepad2,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
  Zap,
} from "lucide-react";

/**
 * Gaming Top-up — live Shop2TopUp catalog through the Verxor panel API.
 * Catalog → game tile → options → denomination → player details → wallet pay.
 */

type CatalogGame = { id: string; name: string; fromNgn: number | null; image?: string | null };
type Variation = { id: string; name: string; priceNgn: number; inStock: boolean };
type DetailField = { field: string; label?: string };
type ProductDetail = {
  id: string;
  name: string;
  image: string | null;
  fields: DetailField[];
  variations: Variation[];
  servers: Array<{ id: string; name: string }>;
};
type OrderResult = {
  ref: string;
  status: string;
  message?: string;
  productName: string;
  variationName: string;
  quantity: number;
  totalNgn: number;
};

const ngn = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

function initialsFor(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/);
  const a = words[0]?.[0] || "G";
  const b = words.length > 1 ? words[1][0] : words[0]?.[1] || "";
  return (a + b).toUpperCase();
}

function linGrad(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 70% 46%), hsl(${(h + 40) % 360} 65% 32%))`;
}

/** Honest in-house promo slides — no fake discounts, only what we deliver. */
const PROMOS = [
  {
    key: "instant",
    icon: Zap,
    title: "Instant delivery",
    text: "Credits land on your player ID in minutes — automatically.",
    grad: "linear-gradient(135deg, #1877F2, #6D28D9)",
  },
  {
    key: "wallet",
    icon: Wallet,
    title: "Pay from your Vernex wallet",
    text: "Fund once, top up anytime. No card needed.",
    grad: "linear-gradient(135deg, #0E7490, #1877F2)",
  },
  {
    key: "tracked",
    icon: ShieldCheck,
    title: "Every order tracked",
    text: "Watch your top-up go from processing to completed, live.",
    grad: "linear-gradient(135deg, #4F46E5, #9333EA)",
  },
];

function AdStrip() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % PROMOS.length), 4000);
    return () => clearInterval(t);
  }, []);
  const p = PROMOS[i];
  const Icon = p.icon;
  return (
    <div className="relative overflow-hidden rounded-[18px] text-white shadow-[0_12px_28px_rgba(24,119,242,0.22)]">
      <div key={p.key} style={{ background: p.grad }}>
        <div className="flex items-center gap-4 px-5 py-5">
          <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-white/20">
            <Icon size={22} />
          </div>
          <div>
            <p className="text-[15px] font-extrabold leading-tight">{p.title}</p>
            <p className="mt-0.5 text-[12px] font-medium text-white/85">{p.text}</p>
          </div>
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {PROMOS.map((s, n) => (
          <button
            key={s.key}
            type="button"
            aria-label={`Show promo ${n + 1}`}
            onClick={() => setI(n)}
            className={`h-1.5 rounded-full transition-all ${
              n === i ? "w-5 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function GamingPage() {
  const [games, setGames] = useState<CatalogGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState<string | null>(null);

  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const [msg, setMsg] = useState("");
  const [needsFund, setNeedsFund] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [checking, setChecking] = useState(false);

  /* Live delivery status (processing -> completed), synced via Verxor. */
  const checkStatus = useCallback(async () => {
    if (!order) return;
    setChecking(true);
    try {
      const supabase = createBrowserClient();
      const { data: sess } = await supabase.auth.getSession();
      const sessionToken = sess.session?.access_token;
      if (!sessionToken) return;
      const res = await fetch("/api/gaming/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ ref: order.ref }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        status?: string;
        message?: string;
      };
      if (data.ok && data.status) {
        setOrder({ ...order, status: data.status, message: data.message || order.message });
      }
    } catch {
      /* ignore: next poll retries */
    } finally {
      setChecking(false);
    }
  }, [order]);

  useEffect(() => {
    if (!order || order.status !== "processing") return;
    const t = setInterval(checkStatus, 15000);
    return () => clearInterval(t);
  }, [order, checkStatus]);

  // Returning visitors see the cached catalog instantly; it refreshes in the
  // background only when stale (6h). Purchases always re-verify live.
  const loadGames = useCallback(async (force = false) => {
    if (!force) {
      try {
        const raw = localStorage.getItem("nex-gaming-catalog");
        if (raw) {
          const cached = JSON.parse(raw) as { at?: number; games?: CatalogGame[] };
          if (Array.isArray(cached.games) && cached.games.length) {
            setGames(cached.games);
            setLoading(false);
            if (Date.now() - (cached.at || 0) < 6 * 60 * 60 * 1000) return;
          }
        }
      } catch {
        /* cache unavailable — load normally */
      }
    } else {
      setLoading(true);
    }
    setLoadError("");
    try {
      const res = await fetch("/api/gaming/catalog", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        games?: CatalogGame[];
      };
      if (!res.ok || !data.ok || !Array.isArray(data.games)) {
        setLoadError(data.error || "Could not load the gaming catalog.");
        setGames([]);
      } else {
        setGames(data.games);
        try {
          localStorage.setItem(
            "nex-gaming-catalog",
            JSON.stringify({ at: Date.now(), games: data.games }),
          );
        } catch {
          /* storage full/unavailable — non-fatal */
        }
      }
    } catch {
      setLoadError("Network error loading the catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGames();
  }, [loadGames]);

  const letterOf = (name: string) => {
    const m = name.match(/[A-Za-z]/);
    return m ? m[0].toUpperCase() : "#";
  };
  const letters = useMemo(
    () => [...new Set(games.map((g) => letterOf(g.name)))].sort((a, b) => a.localeCompare(b)),
    [games],
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return games.filter(
      (g) =>
        (!q || g.name.toLowerCase().includes(q)) &&
        (letter === null || letterOf(g.name) === letter),
    );
  }, [games, query, letter]);

  const variantMode = detail?.id.startsWith("game-") ?? false;

  const openProduct = async (id: string, initialImage?: string | null) => {
    setDetailLoading(true);
    setDetail(null);
    setDetailError("");
    setSelected(null);
    setFieldValues({});
    setQuantity(1);
    setMsg("");
    setOrder(null);
    setNeedsFund(false);
    try {
      const query = `/api/gaming/product?product_id=${encodeURIComponent(id)}${
        initialImage ? `&image=${encodeURIComponent(initialImage)}` : ""
      }`;
      const res = await fetch(query, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        product?: ProductDetail;
      };
      if (!res.ok || !data.ok || !data.product) {
        setDetailError(data.error || "Could not load this product.");
      } else {
        setDetail(data.product);
        const first = data.product.variations.find((v) => v.inStock && v.priceNgn > 0);
        if (first) setSelected(first.id);
      }
    } catch {
      setDetailError("Network error loading this product.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailLoading(false);
    setDetailError("");
    setOrder(null);
    setMsg("");
  };

  const chosen = detail?.variations.find((v) => v.id === selected) || null;
  const missingField = useMemo(() => {
    if (!detail || variantMode) return null;
    const missing = detail.fields.find((f) => !String(fieldValues[f.field] || "").trim());
    return missing ? missing.field : null;
  }, [detail, fieldValues, variantMode]);

  const pay = async () => {
    if (!chosen || !detail || buying || variantMode) return;
    setBuying(true);
    setMsg("");
    setNeedsFund(false);
    try {
      const supabase = createBrowserClient();
      const { data: sess } = await supabase.auth.getSession();
      const sessionToken = sess.session?.access_token;
      if (!sessionToken) {
        setMsg("Sign in to complete your purchase.");
        return;
      }
      const res = await fetch("/api/gaming/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          productId: detail.id,
          variationId: chosen.id,
          quantity,
          fields: fieldValues,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        refunded?: boolean;
        error?: string;
        order?: OrderResult;
      };
      if (!res.ok || !data.ok || !data.order) {
        setMsg(
          String(
            data.error ||
              (data.refunded ? "Purchase failed — wallet refunded" : "The purchase failed. Try again."),
          ),
        );
        setNeedsFund(res.status === 402);
        return;
      }
      setOrder(data.order);
    } catch {
      setMsg("Network error while purchasing. Check your history before retrying.");
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-28">
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#E2E8F0] bg-white/95 px-4 backdrop-blur">
        <Link href="/services" className="text-[#64748B]">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Gamepad2 size={16} />
          </div>
          <h1 className="text-base font-semibold text-[#0F172A]">Gaming Top-up</h1>
        </div>
        <span className="ml-auto rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-bold text-[#1877F2]">
          {games.length ? `${games.length} games` : "Live catalog"}
        </span>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-5">
        {/* Hero */}
        <div className="overflow-hidden rounded-[18px] bg-gradient-to-br from-[#1877F2] to-[#6D28D9] px-5 py-6 text-white shadow-[0_12px_28px_rgba(24,119,242,0.25)]">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
            <Sparkles size={12} /> Official game credits
          </div>
          <h2 className="text-xl font-extrabold leading-tight">Gaming Top-up</h2>
          <p className="mt-1 text-[13px] font-medium text-white/85">
            Instant game credits delivered straight to your player ID — pay from your Vernex wallet.
          </p>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
              <Zap size={12} /> Instant delivery
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
              <ShieldCheck size={12} /> Official publishers
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
              <Wallet size={12} /> Vernex wallet
            </span>
          </div>
        </div>

        {/* Ad strip */}
        <AdStrip />

        {/* Search */}
        <label className="flex h-12 items-center gap-2 rounded-[12px] border border-[#E2E8F0] bg-white px-3">
          <Search size={16} className="text-[#94A3B8]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games…"
            aria-label="Search games"
            className="h-full flex-1 text-sm outline-none placeholder:text-[#94A3B8]"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-[#94A3B8]">
              <X size={14} />
            </button>
          ) : null}
        </label>

        {/* A–Z letter chips */}
        {letters.length ? (
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => { setLetter(null); setQuery(""); }}
              className={`flex-none rounded-full border px-3 py-1.5 text-xs font-bold ${
                letter === null
                  ? "border-[#1877F2] bg-[#EFF6FF] text-[#1877F2]"
                  : "border-[#E2E8F0] bg-white text-[#0F172A]"
              }`}
            >
              All
            </button>
            {letters.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => { setLetter(letter === l ? null : l); setQuery(""); }}
                className={`flex-none rounded-full border px-3 py-1.5 text-xs font-bold ${
                  letter === l
                    ? "border-[#1877F2] bg-[#EFF6FF] text-[#1877F2]"
                    : "border-[#E2E8F0] bg-white text-[#0F172A]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        ) : null}

        {loadError ? (
          <div className="flex items-center gap-2 rounded-[12px] bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600">
            <AlertCircle size={15} /> {loadError}
            <button type="button" onClick={() => void loadGames(true)} className="ml-auto font-bold underline">
              Retry
            </button>
          </div>
        ) : null}

        {/* Grid */}
        <div className="flex items-end justify-between pt-1">
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-[#0F172A]">
            {query ? "Search results" : letter ? `Games · ${letter}` : "All games"}
          </h3>
          {!loading && games.length ? (
            <span className="text-[11px] font-semibold text-[#94A3B8]">{visible.length} shown</span>
          ) : null}
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-[16px] border border-[#E2E8F0] bg-white" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {visible.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => void openProduct(`game-${g.id}`, g.image)}
                className="overflow-hidden rounded-[16px] border border-[#E2E8F0] bg-white text-left shadow-sm transition-all duration-200 hover:border-[#CBD5E1] hover:shadow-md active:scale-[.98]"
              >
                <div
                  className="relative aspect-square w-full overflow-hidden bg-slate-900"
                  style={{ background: linGrad(g.id) }}
                >
                  {g.image && g.image.startsWith("http") ? (
                    <img
                      src={g.image}
                      alt={g.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <span
                    className="absolute inset-0 items-center justify-center text-2xl font-black text-white"
                    style={{ display: g.image && g.image.startsWith("http") ? "none" : "flex" }}
                  >
                    {initialsFor(g.name)}
                  </span>
                </div>
                <div className="space-y-0.5 px-3 py-2.5">
                  <p className="line-clamp-1 text-[13px] font-semibold text-[#0F172A]">{g.name}</p>
                  <p className="text-[11px] font-semibold text-[#1877F2]">
                    {g.fromNgn ? `From ${ngn(g.fromNgn)}` : "View prices"}
                  </p>
                </div>
              </button>
            ))}
            {!visible.length ? (
              <p className="col-span-2 py-10 text-center text-sm text-[#64748B]">
                {query ? `No games match “${query}”.` : "No games yet — check back shortly."}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Buy sheet */}
      {detailLoading || detail || detailError ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#0F172A]/50"
          onClick={closeDetail}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
            className="relative max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white px-4 pb-8 pt-3"
          >
            <button
              type="button"
              onClick={closeDetail}
              aria-label="Close"
              className="absolute right-4 top-3 text-[#64748B]"
            >
              <X size={16} />
            </button>

            {detailLoading ? (
              <div className="flex items-center gap-2 py-20 text-sm text-[#64748B]">
                <Loader2 size={18} className="animate-spin" /> Loading product…
              </div>
            ) : detailError ? (
              <div className="flex items-center gap-2 rounded-[12px] bg-red-50 px-3 py-3 text-[13px] font-medium text-red-600">
                <AlertCircle size={15} /> {detailError}
              </div>
            ) : detail ? (
              <>
                <div className="flex items-center gap-3 pb-4 pt-2">
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-black text-white"
                    style={{ background: linGrad(detail.name) }}
                  >
                    {initialsFor(detail.name)}
                  </span>
                  <div>
                    <h2 className="text-[15px] font-bold text-[#0F172A]">{detail.name}</h2>
                    <p className="text-[12px] text-[#64748B]">
                      {variantMode
                        ? "Pick an option to see its denominations."
                        : "Pick a denomination, enter your player details, pay with your wallet."}
                    </p>
                  </div>
                </div>

                {order ? (
                  <div className="space-y-3 py-6 text-center">
                    <Check size={40} className="mx-auto rounded-full bg-[#E7F6EC] p-2 text-[#16A34A]" />
                    <h3 className="text-lg font-bold text-[#0F172A]">Order placed!</h3>
                    <p className="text-sm text-[#64748B]">
                      {order.productName} · {order.variationName}
                      {order.quantity > 1 ? ` ×${order.quantity}` : ""} — {ngn(order.totalNgn)}
                    </p>
                    <p className="text-[12px] text-[#94A3B8]">Ref: <code>{order.ref}</code></p>
                    <p className="text-[13px] font-semibold text-[#0F172A]">
                      Status:{" "}
                      <span
                        className={
                          order.status === "completed"
                            ? "text-[#16A34A]"
                            : order.status === "refunded"
                              ? "text-[#DC2626]"
                              : "text-[#1877F2]"
                        }
                      >
                        {order.status}
                      </span>
                    </p>
                    {order.message ? (
                      <p className="text-[12px] text-[#64748B]">{order.message}</p>
                    ) : null}
                    <p className="text-[13px] text-[#64748B]">
                      Credits are usually delivered within minutes. The status here updates automatically.
                    </p>
                    <button
                      type="button"
                      onClick={closeDetail}
                      className="h-12 w-full rounded-full bg-[#1877F2] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(24,119,242,0.28)]"
                    >
                      Done
                    </button>
                    {order.status === "processing" ? (
                      <button
                        type="button"
                        onClick={checkStatus}
                        disabled={checking}
                        className="h-11 w-full rounded-full border border-[#E2E8F0] bg-white text-sm font-semibold text-[#334155] disabled:opacity-60"
                      >
                        {checking ? "Checking…" : "Refresh status"}
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <>
                    {/* Player fields */}
                    {!variantMode && detail.fields.length ? (
                      <div className="space-y-3 pb-1">
                        {detail.fields.map((f) => (
                          <label key={f.field} className="block">
                            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                              {f.label || f.field}
                            </span>
                            <input
                              value={String(fieldValues[f.field] || "")}
                              onChange={(e) =>
                                setFieldValues((prev) => ({ ...prev, [f.field]: e.target.value }))
                              }
                              placeholder={`Enter ${(f.label || f.field).toLowerCase()}`}
                              className="h-12 w-full rounded-[12px] border border-[#E2E8F0] px-3 text-sm outline-none focus:border-[#1877F2]"
                            />
                          </label>
                        ))}
                      </div>
                    ) : null}

                    {/* Variations / denominations */}
                    <div className="grid grid-cols-2 gap-2 py-3">
                      {detail.variations.map((v) => {
                        const oos = !v.inStock;
                        if (variantMode) {
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => void openProduct(v.id)}
                              className="col-span-2 flex items-center justify-between rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-3 text-sm font-semibold text-[#0F172A]"
                            >
                              <span>{v.name || "Option"}</span>
                              <span className="text-[12px] font-bold text-[#1877F2]">
                                {v.priceNgn > 0 ? `From ${ngn(v.priceNgn)}` : "View prices"}
                              </span>
                            </button>
                          );
                        }
                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={oos}
                            onClick={() => setSelected(v.id)}
                            className={`rounded-[12px] border px-2 py-3 text-center transition disabled:opacity-50 ${
                              selected === v.id
                                ? "border-[#1877F2] bg-[#EFF6FF] text-[#1877F2]"
                                : "border-[#E2E8F0] bg-white text-[#0F172A]"
                            }`}
                          >
                            <p className="text-[12px] font-semibold leading-tight">{v.name || "Option"}</p>
                            <p className="mt-1 text-[12px] font-bold">{oos ? "Out of stock" : ngn(v.priceNgn)}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Quantity */}
                    {!variantMode ? (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[13px] font-semibold text-[#0F172A]">Quantity</span>
                        <div className="flex items-center gap-3 rounded-full border border-[#E2E8F0] px-2 py-1">
                          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease" className="text-lg font-bold text-[#64748B]">−</button>
                          <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                          <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Increase" className="text-lg font-bold text-[#64748B]">+</button>
                        </div>
                      </div>
                    ) : null}

                    {msg ? (
                      <div className="mb-2 flex items-center gap-2 rounded-[10px] bg-red-50 px-3 py-2 text-[13px] font-medium text-red-600">
                        <AlertCircle size={14} /> {msg}
                      </div>
                    ) : null}

                    {!variantMode ? (
                      <button
                        type="button"
                        disabled={buying || !chosen || Boolean(missingField)}
                        onClick={() => void pay()}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1877F2] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(24,119,242,0.28)] disabled:opacity-60"
                      >
                        {buying ? (
                          <>
                            <Loader2 size={16} className="animate-spin" /> Processing…
                          </>
                        ) : (
                          <>
                            <Wallet size={16} />
                            {chosen
                              ? missingField
                                ? `Enter ${missingField}`
                                : `Pay ${ngn(chosen.priceNgn * quantity)}`
                              : "Select a denomination"}
                          </>
                        )}
                      </button>
                    ) : null}
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
