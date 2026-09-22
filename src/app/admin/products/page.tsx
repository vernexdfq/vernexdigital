"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  Image as ImageIcon,
  X,
  Check,
} from "lucide-react";

type ProductStatus = "draft" | "published" | "out";

type Product = {
  id: string;
  title: string;
  category: string;
  specs: string;
  description: string;
  price: number;
  delivery: string;
  stock: string;
  images: string[];
  status: ProductStatus;
};

const CATEGORIES = ["Phones", "Laptops", "Audio", "Tablets", "Accessories"];

const SEED: Product[] = [
  {
    id: "P1",
    title: "iPhone 17 Pro Max",
    category: "Phones",
    specs: "256GB · Natural Titanium",
    description: "Latest Apple flagship. Sealed unit with full warranty.",
    price: 1850000,
    delivery: "1–3 days",
    stock: "In stock",
    images: ["https://placehold.co/400x400/0F172A/FFFFFF/png?text=iPhone"],
    status: "published",
  },
  {
    id: "P2",
    title: "MacBook Air M3",
    category: "Laptops",
    specs: "16GB · 512GB SSD",
    description: "Lightweight powerhouse for work and school.",
    price: 1450000,
    delivery: "2–4 days",
    stock: "Limited",
    images: ["https://placehold.co/400x400/1877F2/FFFFFF/png?text=MBA"],
    status: "published",
  },
  {
    id: "P3",
    title: "AirPods Pro 3",
    category: "Audio",
    specs: "USB-C · ANC",
    description: "Crystal clear sound with active noise cancel.",
    price: 320000,
    delivery: "Same day (Lagos)",
    stock: "In stock",
    images: ["https://placehold.co/400x400/BE185D/FFFFFF/png?text=AirPods"],
    status: "draft",
  },
];

function naira(n: number) {
  return `₦${n.toLocaleString()}`;
}

const emptyForm = (): Omit<Product, "id"> => ({
  title: "",
  category: "Phones",
  specs: "",
  description: "",
  price: 0,
  delivery: "1–3 days",
  stock: "In stock",
  images: [],
  status: "draft",
});

export default function AdminProductsPage() {
  const [products, setProducts] = useState(SEED);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | ProductStatus>("all");
  const [editor, setEditor] = useState<null | { mode: "add" | "edit"; product: Product | null }>(
    null
  );
  const [form, setForm] = useState(emptyForm());
  const [imageUrl, setImageUrl] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const list = useMemo(() => {
    return products.filter((p) => {
      const matchQ =
        !q ||
        [p.title, p.category, p.specs].some((x) => x.toLowerCase().includes(q.toLowerCase()));
      const matchF = filter === "all" || p.status === filter;
      return matchQ && matchF;
    });
  }, [products, q, filter]);

  function openAdd() {
    setForm(emptyForm());
    setImageUrl("");
    setEditor({ mode: "add", product: null });
  }

  function openEdit(p: Product) {
    setForm({
      title: p.title,
      category: p.category,
      specs: p.specs,
      description: p.description,
      price: p.price,
      delivery: p.delivery,
      stock: p.stock,
      images: [...p.images],
      status: p.status,
    });
    setImageUrl("");
    setEditor({ mode: "edit", product: p });
  }

  function addImage() {
    if (!imageUrl.trim() || form.images.length >= 4) return;
    setForm((f) => ({ ...f, images: [...f.images, imageUrl.trim()] }));
    setImageUrl("");
  }

  function removeImage(i: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  }

  function save(as: ProductStatus) {
    if (!form.title.trim() || !form.price) return;
    const payload = { ...form, status: as };
    if (editor?.mode === "edit" && editor.product) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editor.product!.id ? { ...p, ...payload } : p))
      );
    } else {
      setProducts((prev) => [
        { id: `P${Date.now()}`, ...payload },
        ...prev,
      ]);
    }
    setEditor(null);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }

  function togglePublish(p: Product) {
    setProducts((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? { ...x, status: x.status === "published" ? "draft" : "published" }
          : x
      )
    );
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  const statusChip = (s: ProductStatus) => {
    const map = {
      published: "bg-emerald-50 text-emerald-700 border-emerald-100",
      draft: "bg-slate-100 text-slate-600 border-slate-200",
      out: "bg-red-50 text-red-700 border-red-100",
    };
    const label = s === "out" ? "Out of stock" : s[0].toUpperCase() + s.slice(1);
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[s]}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-20">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-[#64748B]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-base font-semibold text-[#0F172A]">Products</h1>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="h-9 px-3 rounded-full bg-[#1877F2] text-white text-xs font-semibold flex items-center gap-1"
        >
          <Plus size={14} /> Add
        </button>
      </header>

      <div className="px-4 pt-4 max-w-lg mx-auto space-y-3">
        {savedFlash && (
          <div className="flex items-center gap-2 rounded-[12px] bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-700">
            <Check size={16} /> Product saved
          </div>
        )}

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products"
            className="w-full h-11 pl-9 pr-3 rounded-[12px] border border-[#E2E8F0] bg-white text-sm outline-none focus:border-[#1877F2]"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "published", "draft", "out"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold border ${
                filter === f
                  ? "bg-[#1877F2] text-white border-[#1877F2]"
                  : "bg-white text-[#64748B] border-[#E2E8F0]"
              }`}
            >
              {f === "all" ? "All" : f === "out" ? "Out of stock" : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {list.map((p) => (
            <div key={p.id} className="bg-white border border-[#E2E8F0] rounded-[14px] p-3.5">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-[10px] bg-[#F1F5F9] overflow-hidden shrink-0 flex items-center justify-center">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-[#CBD5E1]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{p.title}</p>
                    {statusChip(p.status)}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {p.category} · {p.specs}
                  </p>
                  <p className="text-sm font-semibold text-[#1877F2] mt-1">{naira(p.price)}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="flex-1 h-9 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#0F172A]"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(p)}
                  className="flex-1 h-9 rounded-full bg-[#EFF6FF] text-[#1877F2] text-xs font-semibold"
                >
                  {p.status === "published" ? "Unpublish" : "Release"}
                </button>
                <button
                  type="button"
                  onClick={() => removeProduct(p.id)}
                  className="h-9 px-3 rounded-full border border-red-100 text-red-600 text-xs font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <p className="text-center text-sm text-[#94A3B8] py-12">No products yet. Tap Add to create one.</p>
          )}
        </div>

        <p className="text-[11px] text-[#94A3B8] leading-relaxed">
          Images: paste Drive share links or public image URLs (max 4). Storage stays on your Drive — we only keep metadata.
        </p>
      </div>

      {/* Editor modal */}
      {editor && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setEditor(null)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-[20px] sm:rounded-[20px] max-h-[92vh] overflow-y-auto p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#0F172A]">
                {editor.mode === "add" ? "Add product" : "Edit product"}
              </h2>
              <button type="button" onClick={() => setEditor(null)} className="text-[#94A3B8]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Title">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. iPhone 17 Pro Max"
                  className="w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
                />
              </Field>

              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2] bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Short specs">
                <input
                  value={form.specs}
                  onChange={(e) => setForm({ ...form, specs: e.target.value })}
                  placeholder="256GB · Natural Titanium"
                  className="w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
                />
              </Field>

              <Field label="Full description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2] resize-none"
                />
              </Field>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Price (₦)">
                  <input
                    type="number"
                    value={form.price || ""}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
                    className="w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
                  />
                </Field>
                <Field label="Delivery">
                  <input
                    value={form.delivery}
                    onChange={(e) => setForm({ ...form, delivery: e.target.value })}
                    placeholder="1–3 days"
                    className="w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
                  />
                </Field>
              </div>

              <Field label="Stock">
                <select
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  className="w-full h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2] bg-white"
                >
                  <option>In stock</option>
                  <option>Limited</option>
                  <option>Out of stock</option>
                </select>
              </Field>

              <Field label={`Images (${form.images.length}/4) — Drive / public URL`}>
                <div className="flex gap-2">
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="flex-1 h-11 px-3 rounded-[12px] border border-[#E2E8F0] text-sm outline-none focus:border-[#1877F2]"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    disabled={form.images.length >= 4}
                    className="h-11 px-3 rounded-[12px] bg-[#EFF6FF] text-[#1877F2] text-xs font-semibold disabled:opacity-40"
                  >
                    Add
                  </button>
                </div>
                {form.images.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {form.images.map((src, i) => (
                      <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#F1F5F9]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => save("draft")}
                  className="h-11 rounded-full border border-[#E2E8F0] text-sm font-semibold text-[#0F172A]"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  onClick={() => save("published")}
                  className="h-11 rounded-full bg-[#1877F2] text-white text-sm font-semibold"
                >
                  Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
