"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  X,
  Zap,
  Minus,
  Plus,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";
import { fetchShopProducts, type ShopAdminProduct } from "@/lib/shopProducts";
import { createOrderRequest } from "@/lib/shopRequests";
import { useUser } from "@/lib/useUser";

/**
 * Admin image upload sizes (document for admin panel):
 * Card thumbnail (grid):     400 x 400 px  (1:1)  · max 400 KB  · WebP/JPEG
 * Detail primary image:      800 x 800 px  (1:1)  · max 800 KB
 * Gallery extra images:      800 x 800 px  (1:1)  · max 800 KB each
 * Optional banner (promo):  1200 x 600 px  (2:1)  · max 1 MB
 *
 * Uploaded images fill card and detail slots. Admin can upload multiple
 * gallery images; "View all photos" shows the full set.
 */

type ShopProduct = {
  id: string;
  category: string;
  name: string;
  subtitle: string;
  description: string;
  bullets: string[];
  tags: string[];
  price: number;
  stock: number;
  delivery: string;
  image: string;
  gallery: string[];
  specs?: string[];
};

const FILTERS = [
  "All",
  "Laptops & Computers",
  "Mobile Phones",
  "Electronics",
  "Airpods & Audio",
  "Power Banks & Chargers",
  "Smart Watches",
  "Tablets",
  "Gaming",
  "Phone Accessories",
];

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

export default function ShoppingPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<ShopProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [adminProducts, setAdminProducts] = useState<ShopAdminProduct[]>([]);
  const [placing, setPlacing] = useState(false);
  const [notice, setNotice] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [locationText, setLocationText] = useState("");
  const { profile } = useUser();
  const router = useRouter();

  /* products posted from the admin Shopping dashboard (Supabase) */
  const reloadProducts = useCallback(async () => {
    try {
      const rows = await fetchShopProducts();
      setAdminProducts(rows);
    } catch {
      /* offline — keep whatever is already loaded */
    }
  }, []);

  useEffect(() => {
    reloadProducts();
  }, [reloadProducts]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const catalog: ShopProduct[] = useMemo(() => {
    const mapped: ShopProduct[] = adminProducts.map((p) => ({
      id: p.id,
      category: p.category,
      name: p.title,
      subtitle: p.condition,
      description: p.description,
      bullets: [],
      tags: [p.condition, p.category],
      price: p.price,
      stock: p.stock,
      delivery: "1–3 days",
      image: p.images[0] ?? "",
      gallery: p.images,
      specs: [],
    }));
    return mapped;
  }, [adminProducts]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((p) => {
      if (filter !== "All" && p.category !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, filter, catalog]);

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected, galleryOpen]);

  function openProduct(p: ShopProduct) {
    setSelected(p);
    setQty(1);
    setPhotoIndex(0);
    setGalleryOpen(false);
    setNotice("");
  }

  function openCheckout() {
    if (!selected) return;
    if (!profile) {
      setNotice("Sign in to place an order");
      return;
    }
    if (qty > selected.stock) {
      setNotice("Not enough stock available");
      return;
    }
    if (!whatsapp.trim() && profile.phone) setWhatsapp(profile.phone);
    setCheckoutOpen(true);
  }

  async function submitRequest() {
    if (!selected || placing) return;
    if (whatsapp.trim().length < 7) {
      setNotice("Enter your WhatsApp number");
      return;
    }
    if (locationText.trim().length < 4) {
      setNotice("Enter your delivery location");
      return;
    }
    setPlacing(true);
    try {
      await createOrderRequest({
        productId: selected.id,
        productTitle: selected.name,
        quantity: qty,
        unitPrice: selected.price,
        whatsapp: whatsapp.trim(),
        location: locationText.trim(),
      });
      setCheckoutOpen(false);
      setSelected(null);
      setQty(1);
      setNotice("Order sent — the admin will reply with your delivery cost");
      router.push("/services/shopping/orders");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Could not send order");
    } finally {
      setPlacing(false);
    }
  }

  const photos = selected
    ? selected.gallery.length
      ? selected.gallery
      : [selected.image]
    : [];
  const total = selected ? selected.price * qty : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center gap-3">
          <Link
            href="/services"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[15px] font-semibold text-[#0F172A]">Shopping</h1>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="rounded-[14px] bg-gradient-to-br from-[#1877F2] to-[#0D5FBF] p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
          <p className="text-[10px] font-semibold tracking-widest text-blue-100 uppercase">
            Marketplace
          </p>
          <p className="text-lg font-semibold text-white mt-1">Gadgets & more</p>
          <p className="text-[12px] text-blue-100 mt-1 leading-snug max-w-[90%]">
            Phones, laptops, AirPods and accessories — pay from wallet.
          </p>
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phones, laptops…"
            className="w-full h-11 pl-10 pr-3 rounded-[12px] bg-white border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1877F2] focus:ring-2 focus:ring-[#1877F2]/15"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {FILTERS.map((f) => {
            const chipClass =
              filter === f
                ? "bg-[#1877F2] text-white"
                : "bg-white border border-[#E2E8F0] text-[#475569]";
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`shrink-0 h-8 px-3.5 rounded-full text-xs font-medium transition ${chipClass}`}
              >
                {f}
              </button>
            );
          })}
        </div>

        {list.length === 0 ? (
          <div className="rounded-[14px] bg-white border border-[#E2E8F0] py-16 text-center">
            <p className="text-sm text-[#94A3B8]">No products match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => openProduct(p)}
                className="text-left rounded-[14px] bg-white border border-[#E2E8F0] overflow-hidden flex flex-col active:scale-[0.98] transition"
              >
                <div className="relative aspect-square bg-[#F1F5F9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  {p.gallery.length > 1 && (
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/55 text-white text-[10px] font-medium flex items-center gap-0.5">
                      <ImageIcon size={10} />
                      {p.gallery.length}
                    </span>
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <p className="text-[13px] font-semibold text-[#0F172A] leading-snug line-clamp-2">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#94A3B8] line-clamp-1">
                    {p.subtitle}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#16A34A]">
                    <Zap size={11} />
                    {p.delivery}
                  </div>
                  <p className="mt-2 text-[15px] font-semibold text-[#0F172A] tabular-nums">
                    {formatNaira(p.price)}
                  </p>
                  <span className="mt-2.5 w-full h-9 rounded-[10px] bg-[#1877F2] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5">
                    <ShoppingCart size={14} />
                    Buy
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[90] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-white rounded-t-[20px] max-h-[92vh] flex flex-col shadow-xl">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="w-9 h-9 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"
              >
                <X size={18} />
              </button>
              <p className="text-sm font-semibold text-[#0F172A]">Product details</p>
              <span className="w-9" />
            </div>

            <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-4">
              <div className="relative aspect-square rounded-[14px] overflow-hidden bg-[#F1F5F9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photos[photoIndex] ?? selected.image}
                  alt={selected.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoIndex((i) => (i + 1) % photos.length)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 text-white flex items-center justify-center"
                    >
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {photos.map((_, i) => {
                        const dotClass =
                          i === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/50";
                        return (
                          <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${dotClass}`}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setGalleryOpen(true)}
                  className="w-full h-10 rounded-[10px] border border-[#E2E8F0] text-sm font-medium text-[#1877F2] flex items-center justify-center gap-2"
                >
                  <ImageIcon size={16} />
                  View all photos ({photos.length})
                </button>
              )}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1877F2]">
                  {selected.category}
                </p>
                <h2 className="mt-1 text-lg font-bold text-[#0F172A]">
                  {selected.name}
                </h2>
                <p className="mt-0.5 text-sm text-[#64748B]">{selected.subtitle}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1877F2] text-[11px] font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase">
                  Description
                </p>
                <p className="mt-1.5 text-sm text-[#334155] leading-relaxed">
                  {selected.description}
                </p>
              </div>

              <ul className="space-y-2">
                {selected.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-sm text-[#334155]"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#1877F2] shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              {selected.specs && selected.specs.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase mb-2">
                    Specs
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.specs.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 rounded-[8px] bg-[#F1F5F9] text-[12px] font-medium text-[#475569]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm text-[#64748B]">Quantity</p>
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

              <p className="text-[11px] text-[#94A3B8] leading-relaxed pb-2">
                Stock and delivery are managed from the admin catalog. Upload
                product images at 400×400 (card) and 800×800 (detail/gallery)
                so they display correctly on mobile.
              </p>
            </div>

            <div className="shrink-0 border-t border-[#E2E8F0] bg-white px-4 pt-3 pb-3">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-[11px] text-[#94A3B8]">
                    Price each · {selected.stock} available
                  </p>
                  <p className="text-xl font-semibold text-[#0F172A] tabular-nums">
                    {formatNaira(total)}
                  </p>
                </div>
                <span className="text-[12px] text-[#16A34A] flex items-center gap-1 mb-1">
                  <Zap size={12} />
                  {selected.delivery}
                </span>
              </div>
              <button
                type="button"
                onClick={openCheckout}
                disabled={placing}
                className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition disabled:opacity-60"
              >
                <ShieldCheck size={18} />
                {"Continue to checkout · " + formatNaira(total)}
              </button>
            </div>
          </div>
        </div>
      )}

      {galleryOpen && selected && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              type="button"
              onClick={() => setGalleryOpen(false)}
              className="w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center"
            >
              <X size={18} />
            </button>
            <p className="text-sm font-medium text-white">
              {photoIndex + 1} / {photos.length}
            </p>
            <span className="w-9" />
          </div>
          <div className="flex-1 relative flex items-center justify-center px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[photoIndex]}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)
                  }
                  className="absolute left-3 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPhotoIndex((i) => (i + 1) % photos.length)
                  }
                  className="absolute right-3 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
          <div className="px-4 pb-8 flex gap-2 overflow-x-auto">
            {photos.map((src, i) => {
              const thumbClass =
                i === photoIndex ? "border-white" : "border-transparent opacity-70";
              return (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setPhotoIndex(i)}
                  className={`shrink-0 w-16 h-16 rounded-[10px] overflow-hidden border-2 ${thumbClass}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {checkoutOpen && selected && (
        <div className="fixed inset-0 z-[110] flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close checkout"
            onClick={() => setCheckoutOpen(false)}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
          />
          <div className="relative rounded-t-2xl bg-white shadow-2xl">
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between px-4 pt-2.5">
              <h3 className="text-[15px] font-extrabold text-slate-900">Checkout</h3>
              <button
                type="button"
                onClick={() => setCheckoutOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 px-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selected.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-slate-900">{selected.name}</p>
                    <p className="text-[11px] text-slate-400">{selected.subtitle}</p>
                    <p className="mt-0.5 text-[13px] font-extrabold text-slate-900">{"₦" + (selected.price * qty).toLocaleString("en-NG")}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-[13px] font-bold text-slate-900 tabular-nums">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.min(selected.stock, q + 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-[12px] font-semibold text-slate-700">
                  WhatsApp number <span className="text-red-500">*</span>
                </label>
                <input
                  value={whatsapp}
                  inputMode="tel"
                  maxLength={20}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9+ ]/g, ""))}
                  placeholder="e.g. 0801 234 5678"
                  className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[14px] font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="mt-3.5">
                <label className="text-[12px] font-semibold text-slate-700">
                  Delivery location <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={locationText}
                  maxLength={300}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="Where should it be delivered? e.g. 12 Allen Avenue, Ikeja, Lagos"
                  rows={3}
                  className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-[13px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1.5 text-[11px] leading-snug text-slate-400">
                  The admin will reply in chat with the delivery cost for your location.
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 px-4 pb-5 pt-3.5">
              <button
                type="button"
                onClick={submitRequest}
                disabled={placing}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-[14px] font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
              >
                <ShieldCheck size={18} />
                {placing ? "Sending…" : "Send order request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div
          className="fixed bottom-6 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-[#0F172A] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg"
          role="status"
        >
          {notice}
        </div>
      )}
    </div>
  );
}
