"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import {
  Check,
  ChevronDown,
  ImagePlus,
  Minus,
  Package,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  loadShopProducts,
  saveShopProducts,
  SHOP_CATEGORIES,
  SHOP_CONDITIONS,
  type ShopAdminProduct,
  type ShopCondition,
} from "@/lib/shopProducts";

const MAX_IMAGES = 8;
const MIN_IMAGES = 3;

function naira(n: number) {
  return "\u20A6" + n.toLocaleString("en-NG");
}

/* resize an image file to a compact data URL so it fits in local storage */
async function fileToDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });
    const MAX = 900;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return dataUrl;
  }
}

type FormErrors = {
  title?: boolean;
  category?: boolean;
  images?: boolean;
  condition?: boolean;
  description?: boolean;
  price?: boolean;
};

export default function AdminShoppingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  /* form state */
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [condition, setCondition] = useState<ShopCondition | null>(null);
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");
  const [stockText, setStockText] = useState("1");
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState("");

  /* catalog state */
  const [products, setProducts] = useState<ShopAdminProduct[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ShopAdminProduct | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProducts(loadShopProducts());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const price = Math.round(Number(priceText) || 0);
  const stock = Math.max(0, Math.round(Number(stockText) || 0));

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const room = MAX_IMAGES - images.length;
      const picked = Array.from(files).slice(0, Math.max(0, room));
      const urls: string[] = [];
      for (const file of picked) {
        if (!file.type.startsWith("image/")) continue;
        urls.push(await fileToDataUrl(file));
      }
      if (urls.length > 0) {
        setImages((prev) => [...prev, ...urls]);
        setErrors((prev) => ({ ...prev, images: false }));
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveFirst(index: number) {
    setImages((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
  }

  function postProduct() {
    const nextErrors: FormErrors = {
      title: title.trim().length < 3,
      category: !category,
      images: images.length < MIN_IMAGES,
      condition: !condition,
      description: description.trim().length < 10,
      price: price <= 0,
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const product: ShopAdminProduct = {
      id: "P" + Date.now().toString(36).toUpperCase(),
      title: title.trim(),
      category: category!,
      images,
      condition: condition!,
      description: description.trim(),
      price,
      stock: stock > 0 ? stock : 1,
      createdAt: Date.now(),
    };
    const next = [product, ...products];
    setProducts(next);
    saveShopProducts(next);
    setTitle("");
    setCategory(null);
    setCondition(null);
    setDescription("");
    setPriceText("");
    setStockText("1");
    setImages([]);
    setErrors({});
    setToast("Product posted — live on the Shopping page");
  }

  function changeStock(product: ShopAdminProduct, delta: number) {
    const nextStock = Math.max(0, product.stock + delta);
    const next = products.map((p) => (p.id === product.id ? { ...p, stock: nextStock } : p));
    setProducts(next);
    saveShopProducts(next);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const next = products.filter((p) => p.id !== deleteTarget.id);
    setProducts(next);
    saveShopProducts(next);
    setToast("Product deleted");
    setDeleteTarget(null);
  }

  const err = (flag?: boolean) => (flag ? "This field is required" : null);
  const listedCount = useMemo(() => products.length, [products]);

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-16">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-2.5 px-4">
          <AdminMenuButton onClick={() => setMenuOpen(true)} />
          <div className="min-w-0">
            <h1 className="text-[16px] font-extrabold tracking-tight text-[#0F172A]">Shopping</h1>
            <p className="text-[11px] font-semibold text-[#64748B] truncate">
              Post products for your customers
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-bold text-[#1877F2] tabular-nums">
            {listedCount} listed
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {/* ------------------------------ post form ------------------------------ */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-[15px] font-bold text-slate-900">Post Product</h2>
          <p className="mt-0.5 text-[12px] text-slate-400">
            Fill the details below — your product goes live on the Shopping page instantly.
          </p>

          {/* title */}
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <label className="text-[12px] font-semibold text-slate-700">
                Title <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">{title.length} / 70</span>
            </div>
            <input
              value={title}
              maxLength={70}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: false }));
              }}
              placeholder="e.g. iPhone 17 Pro Max 256GB"
              className={
                "mt-1.5 h-[48px] w-full rounded-xl border bg-slate-50 px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 " +
                (errors.title ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-[#1877F2] focus:ring-blue-100")
              }
            />
            {err(errors.title) && <p className="mt-1 text-[12px] font-medium text-red-500">{err(errors.title)}</p>}
          </div>

          {/* category */}
          <div className="mt-4">
            <label className="text-[12px] font-semibold text-slate-700">
              Category <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setCategoryPickerOpen(true)}
              className={
                "mt-1.5 flex h-[48px] w-full items-center justify-between rounded-xl border bg-slate-50 px-3.5 text-left text-[14px] focus:outline-none " +
                (errors.category && !category ? "border-red-300" : "border-slate-200")
              }
            >
              <span className={category ? "font-medium text-slate-900" : "text-slate-400"}>
                {category ?? "Select a category"}
              </span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
            {errors.category && !category && <p className="mt-1 text-[12px] font-medium text-red-500">This field is required</p>}
          </div>

          {/* photos */}
          <div className="mt-4">
            <label className="text-[12px] font-semibold text-slate-700">
              Add at least {MIN_IMAGES} photos <span className="text-red-500">*</span>
            </label>
            <p className="mt-0.5 text-[11px] text-slate-400">
              First picture is the title picture. JPG, PNG, WEBP.
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {images.map((src, index) => (
                <div key={index} className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200">
                  <img src={src} alt={"Photo " + (index + 1)} className="h-full w-full object-cover" />
                  {index === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-md bg-[#0B1220]/85 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      Title photo
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={"Remove photo " + (index + 1)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-red-500 shadow-sm"
                  >
                    <X size={13} strokeWidth={2.6} />
                  </button>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => moveFirst(index)}
                      className="absolute bottom-1.5 right-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 shadow-sm"
                    >
                      Make first
                    </button>
                  )}
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition hover:border-[#1877F2] hover:text-[#1877F2] disabled:opacity-60"
                >
                  <Plus size={22} strokeWidth={2.4} />
                  <span className="text-[10px] font-semibold">{uploading ? "Loading…" : "Add photo"}</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
            <p className={"mt-1.5 text-[11px] tabular-nums " + (errors.images ? "font-semibold text-red-500" : "text-slate-400")}>
              {images.length} / {MIN_IMAGES} minimum{" "}
              {errors.images ? "— add at least " + MIN_IMAGES + " photos" : ""}
            </p>
          </div>

          {/* condition */}
          <div className="mt-4">
            <label className="text-[12px] font-semibold text-slate-700">
              Condition <span className="text-red-500">*</span>
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {SHOP_CONDITIONS.map((option) => {
                const active = condition === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setCondition(option);
                      setErrors((prev) => ({ ...prev, condition: false }));
                    }}
                    className={
                      "h-10 rounded-xl border text-[12px] font-semibold transition " +
                      (active
                        ? "border-[#1877F2] bg-[#1877F2] text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")
                    }
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {errors.condition && !condition && <p className="mt-1 text-[12px] font-medium text-red-500">This field is required</p>}
          </div>

          {/* description */}
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <label className="text-[12px] font-semibold text-slate-700">
                Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 tabular-nums">{description.length} / 1000</span>
            </div>
            <textarea
              value={description}
              maxLength={1000}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({ ...prev, description: false }));
              }}
              placeholder="Describe the product: what it is, what is included, and anything the buyer should know."
              rows={6}
              className={
                "mt-1.5 min-h-[130px] w-full resize-y rounded-xl border bg-slate-50 p-3.5 text-[13px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 " +
                (errors.description ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-[#1877F2] focus:ring-blue-100")
              }
            />
            {err(errors.description) && <p className="mt-1 text-[12px] font-medium text-red-500">{err(errors.description)}</p>}
          </div>

          {/* price + stock */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-slate-700">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-slate-400">{"\u20A6"}</span>
                <input
                  value={priceText}
                  inputMode="numeric"
                  onChange={(e) => {
                    setPriceText(e.target.value.replace(/[^0-9]/g, ""));
                    setErrors((prev) => ({ ...prev, price: false }));
                  }}
                  placeholder="0"
                  className={
                    "h-[48px] w-full rounded-xl border bg-slate-50 pl-8 pr-3 text-[14px] font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 " +
                    (errors.price ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-[#1877F2] focus:ring-blue-100")
                  }
                />
              </div>
              {errors.price && <p className="mt-1 text-[12px] font-medium text-red-500">This field is required</p>}
            </div>
            <div>
              <label className="text-[12px] font-semibold text-slate-700">Stock</label>
              <input
                value={stockText}
                inputMode="numeric"
                onChange={(e) => setStockText(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 5"
                className="mt-1.5 h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[14px] font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-[11px] text-slate-400">How many are in stock</p>
            </div>
          </div>

          <button
            type="button"
            onClick={postProduct}
            className="mt-5 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1877F2] text-[14px] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.3)] transition active:scale-[0.99]"
          >
            <Plus size={18} strokeWidth={2.6} />
            Post Product
          </button>
        </section>

        {/* ---------------------------- products list ---------------------------- */}
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[13px] font-bold text-slate-900">Your Products</h2>
            <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{listedCount} total</span>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Package size={22} />
              </span>
              <p className="mt-3 text-[13px] font-semibold text-slate-500">No products yet</p>
              <p className="mt-0.5 text-[12px] text-slate-400">Post your first product with the form above.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {products.map((product) => {
                const out = product.stock <= 0;
                return (
                  <div key={product.id} className="rounded-2xl border border-slate-200 bg-white p-3.5">
                    <div className="flex gap-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {product.images[0] ? (
                          <img src={product.images[0]} alt={product.title} className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-slate-300">
                            <ImagePlus size={18} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-slate-900">{product.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {product.category} · {product.condition}
                        </p>
                        <p className="mt-1 text-[13px] font-extrabold text-slate-900 tabular-nums">{naira(product.price)}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-between">
                        <span
                          className={
                            "rounded-full px-2 py-0.5 text-[10px] font-bold " +
                            (out ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")
                          }
                        >
                          {out ? "Out of stock" : product.stock + " in stock"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 active:bg-red-50"
                          aria-label={"Delete " + product.title}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* stock stepper */}
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-[11px] font-semibold text-slate-500">Stock count</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeStock(product, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 active:scale-95"
                          aria-label="Decrease stock"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-[13px] font-bold text-slate-900 tabular-nums">{product.stock}</span>
                        <button
                          type="button"
                          onClick={() => changeStock(product, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 active:scale-95"
                          aria-label="Increase stock"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* category picker */}
      {categoryPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setCategoryPickerOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" />
          <div className="relative w-full rounded-t-[24px] bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
            <h3 className="text-[15px] font-bold text-slate-900">Select Category</h3>
            <div className="mt-3 space-y-1.5">
              {SHOP_CATEGORIES.map((option) => {
                const active = category === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setCategory(option);
                      setCategoryPickerOpen(false);
                      setErrors((prev) => ({ ...prev, category: false }));
                    }}
                    className={
                      "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-[14px] font-medium transition " +
                      (active ? "border-[#1877F2] bg-blue-50 text-[#1877F2]" : "border-slate-200 text-slate-700")
                    }
                  >
                    {option}
                    {active && <Check size={16} strokeWidth={2.6} />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setCategoryPickerOpen(false)}
              className="mt-3 h-11 w-full rounded-xl text-[13px] font-semibold text-slate-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-500">
              <Trash2 size={18} />
              <h3 className="text-[15px] font-bold text-slate-900">Delete product?</h3>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
              {deleteTarget.title} will be removed from the Shopping page. This cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="h-11 flex-1 rounded-xl bg-slate-100 text-[13px] font-semibold text-slate-600">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="h-11 flex-1 rounded-xl bg-red-500 text-[13px] font-bold text-white active:opacity-90">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg" role="status">
          <Check size={15} className="text-emerald-400" strokeWidth={2.6} />
          {toast}
        </div>
      )}
    </div>
  );
}
