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
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

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

const PRODUCTS: ShopProduct[] = [
  {
    id: "iphone-17-pro-max",
    category: "Phones",
    name: "iPhone 17 Pro Max",
    subtitle: "256GB · Natural Titanium",
    description:
      "Latest Apple flagship. Factory sealed, full warranty. Storage 256GB, Natural Titanium finish. Includes original box and accessories.",
    bullets: [
      "Factory sealed · Apple warranty",
      "256GB storage",
      "Natural Titanium",
      "Nationwide delivery available",
    ],
    tags: ["Apple", "Flagship", "New"],
    price: 1850000,
    stock: 6,
    delivery: "1–3 days",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&h=800&fit=crop",
    ],
    specs: ["Display 6.9\"", "A19 Pro", "48MP system", "USB-C"],
  },
  {
    id: "airpods-pro-2",
    category: "Audio",
    name: "AirPods Pro (2nd gen)",
    subtitle: "USB-C · ANC",
    description:
      "Apple AirPods Pro 2 with USB-C case. Active noise cancellation, adaptive audio, and spatial audio. Sealed unit.",
    bullets: [
      "Active noise cancellation",
      "USB-C charging case",
      "Spatial audio",
      "Sealed retail box",
    ],
    tags: ["Apple", "ANC"],
    price: 285000,
    stock: 24,
    delivery: "1–2 days",
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&h=800&fit=crop",
    ],
    specs: ["ANC", "USB-C", "MagSafe"],
  },
  {
    id: "macbook-air-m3",
    category: "Laptops",
    name: "MacBook Air M3",
    subtitle: "13\" · 16GB · 512GB",
    description:
      "MacBook Air 13-inch with M3 chip, 16GB unified memory and 512GB SSD. Midnight colour. Ideal for work and school.",
    bullets: [
      "Apple M3 chip",
      "16GB unified memory",
      "512GB SSD",
      "Up to 18 hours battery",
    ],
    tags: ["Apple", "M3"],
    price: 1450000,
    stock: 4,
    delivery: "2–4 days",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop",
    ],
    specs: ["13.6\" Liquid Retina", "M3", "16GB RAM", "512GB"],
  },
  {
    id: "samsung-s25-ultra",
    category: "Phones",
    name: "Samsung Galaxy S25 Ultra",
    subtitle: "512GB · Titanium Gray",
    description:
      "Samsung flagship with S Pen, 200MP camera and long battery life. 512GB storage, Titanium Gray.",
    bullets: [
      "S Pen included",
      "200MP main camera",
      "512GB storage",
      "Full Samsung warranty",
    ],
    tags: ["Samsung", "Flagship"],
    price: 1680000,
    stock: 9,
    delivery: "1–3 days",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop",
    ],
    specs: ["6.8\" Dynamic AMOLED", "S Pen", "200MP", "512GB"],
  },
  {
    id: "ipad-air-m2",
    category: "Tablets",
    name: "iPad Air M2",
    subtitle: "11\" · 128GB · Wi-Fi",
    description:
      "iPad Air with M2 chip, 11-inch Liquid Retina display, 128GB. Perfect for notes, streaming and light creative work.",
    bullets: [
      "Apple M2 chip",
      "11\" Liquid Retina",
      "128GB storage",
      "Supports Apple Pencil Pro",
    ],
    tags: ["Apple", "Tablet"],
    price: 720000,
    stock: 11,
    delivery: "1–3 days",
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop",
    ],
    specs: ["11\"", "M2", "128GB", "Wi-Fi"],
  },
  {
    id: "powerbank-20000",
    category: "Accessories",
    name: "20000mAh Power Bank",
    subtitle: "45W PD · Dual port",
    description:
      "High-capacity 20000mAh power bank with 45W USB-C PD. Charges phones and tablets fast. Airline-safe capacity.",
    bullets: [
      "20000mAh capacity",
      "45W USB-C Power Delivery",
      "Dual ports",
      "LED charge indicator",
    ],
    tags: ["Charging", "Travel"],
    price: 28500,
    stock: 80,
    delivery: "Same day (Lagos)",
    image: "https://images.unsplash.com/photo-1609091839311-b140b7d1b0a9?w=800&h=800&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1609091839311-b140b7d1b0a9?w=800&h=800&fit=crop",
    ],
    specs: ["20000mAh", "45W PD", "USB-C + USB-A"],
  },
];

const FILTERS = ["All", "Phones", "Laptops", "Audio", "Tablets", "Accessories"];

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function ShoppingPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<ShopProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (filter !== "All" && p.category !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, filter]);

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
                      {photos.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1.5 rounded-full transition-all ${
                            i === photoIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                          }`}
                        />
                      ))}
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
                className="w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition"
              >
                <ShieldCheck size={18} />
                Continue to checkout · {formatNaira(total)}
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
            {photos.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setPhotoIndex(i)}
                className={`shrink-0 w-16 h-16 rounded-[10px] overflow-hidden border-2 ${
                  i === photoIndex ? "border-white" : "border-transparent opacity-70"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
