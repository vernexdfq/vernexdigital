"use client";

import { useMemo, useState } from "react";
import { useUser } from "@/lib/useUser";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  X,
  Link2,
  Check,
  Folder,
  Star,
  Rocket,
  GraduationCap,
  Info,
  RefreshCw,
  Zap,
  Wallet,
  ClipboardPaste,
  ListOrdered,
} from "lucide-react";

/* ---------------------------------- data ---------------------------------- */
/* Same data model — swap these arrays for provider API responses later. */

type Platform = { id: string; name: string; color: string; initial: string };

const PLATFORMS: Platform[] = [
  { id: "instagram", name: "Instagram", color: "#E1306C", initial: "IG" },
  { id: "facebook", name: "Facebook", color: "#1877F2", initial: "FB" },
  { id: "tiktok", name: "TikTok", color: "#111827", initial: "TT" },
  { id: "youtube", name: "YouTube", color: "#FF0000", initial: "YT" },
  { id: "twitter", name: "Twitter / X", color: "#0F172A", initial: "X" },
  { id: "audiomack", name: "Audiomack", color: "#FFA200", initial: "AM" },
  { id: "telegram", name: "Telegram", color: "#2AABEE", initial: "TG" },
  { id: "spotify", name: "Spotify", color: "#1DB954", initial: "SP" },
];

type Service = {
  id: string;
  categoryId: string;
  group: string;
  name: string;
  ratePer1000: number;
  min: number;
  max: number;
  speed: string;
};

const SERVICES: Service[] = [
  { id: "ig-followers", categoryId: "instagram", group: "Followers", name: "Instagram Followers [HQ] [Non Drop]", ratePer1000: 1850, min: 100, max: 500000, speed: "1K / day" },
  { id: "ig-likes", categoryId: "instagram", group: "Likes", name: "Instagram Likes [Real] [Fast]", ratePer1000: 420, min: 50, max: 100000, speed: "Instant" },
  { id: "ig-views", categoryId: "instagram", group: "Views", name: "Instagram Views [Instant]", ratePer1000: 180, min: 100, max: 1000000, speed: "Instant" },
  { id: "fb-page-followers", categoryId: "facebook", group: "Followers", name: "Facebook Page Followers", ratePer1000: 2100, min: 100, max: 200000, speed: "500 / day" },
  { id: "fb-page-likes", categoryId: "facebook", group: "Likes", name: "Facebook Page Likes", ratePer1000: 1950, min: 50, max: 100000, speed: "500 / day" },
  { id: "tt-followers", categoryId: "tiktok", group: "Followers", name: "TikTok Followers [Stable]", ratePer1000: 2400, min: 100, max: 300000, speed: "1K / day" },
  { id: "tt-likes", categoryId: "tiktok", group: "Likes", name: "TikTok Likes [Fast]", ratePer1000: 550, min: 50, max: 500000, speed: "10K / day" },
  { id: "yt-subs", categoryId: "youtube", group: "Subscribers", name: "YouTube Subscribers [Real]", ratePer1000: 8900, min: 50, max: 50000, speed: "100 / day" },
  { id: "yt-views", categoryId: "youtube", group: "Views", name: "YouTube Views [Retention]", ratePer1000: 980, min: 500, max: 1000000, speed: "5K / day" },
  { id: "x-followers", categoryId: "twitter", group: "Followers", name: "Twitter / X Followers", ratePer1000: 3200, min: 100, max: 100000, speed: "500 / day" },
  { id: "am-likes", categoryId: "audiomack", group: "Likes", name: "Audiomack Likes [Worldwide] [Non Drop]", ratePer1000: 2122.07, min: 100, max: 10000000, speed: "5K / day" },
  { id: "tg-members", categoryId: "telegram", group: "Members", name: "Telegram Channel Members", ratePer1000: 1650, min: 100, max: 200000, speed: "1K / day" },
  { id: "sp-plays", categoryId: "spotify", group: "Plays", name: "Spotify Plays", ratePer1000: 1100, min: 1000, max: 500000, speed: "10K / day" },
];

const QTY_CHIPS = [500, 1000, 2500, 5000];

function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* --------------------------------- pieces --------------------------------- */

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{children}</span>;
}

function FormRow({
  label,
  value,
  placeholder,
  icon,
  onClick,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <button
        type="button"
        onClick={onClick}
        className="mt-2 flex min-h-[58px] w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition-colors hover:border-slate-300 active:border-[#1877F2]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1877F2]">{icon}</span>
          <span
            className={"truncate text-[14px] leading-snug " + (value ? "font-medium text-slate-900" : "text-slate-400")}
          >
            {value ?? placeholder}
          </span>
        </div>
        {value ? <Check size={16} className="shrink-0 text-[#1877F2]" /> : <span className="shrink-0 text-slate-300 text-[18px] leading-none">⌄</span>}
      </button>
    </div>
  );
}

/* full-screen searchable picker page — scales to any number of items */
function PickerPage({
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
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white px-4">
        <button type="button" onClick={onClose} className="flex items-center gap-1 text-[14px] font-medium text-slate-900">
          <ArrowLeft size={18} />
          Back
        </button>
        <h1 className="text-[14px] font-semibold text-slate-900">{title}</h1>
        <span className="w-10" />
      </header>
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search..."
            autoFocus
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-[#1877F2]/10"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-8">{children}</div>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function BoostAccountPage() {
  const { wallet } = useUser();
  const balance = wallet.balance;

  const [platformId, setPlatformId] = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null); // null = All Services
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");
  const [placed, setPlaced] = useState<{ id: string; service: string; speed: string; qty: number; total: number; status: string; link: string }[]>([]);

  const [picker, setPicker] = useState<"platform" | "category" | "service" | null>(null);
  const [pSearch, setPSearch] = useState("");
  const [cSearch, setCSearch] = useState("");
  const [sSearch, setSSearch] = useState("");

  const platform = PLATFORMS.find((p) => p.id === platformId) ?? null;
  const service = SERVICES.find((s) => s.id === serviceId) ?? null;

  const filteredPlatforms = useMemo(() => {
    const q = pSearch.trim().toLowerCase();
    return q ? PLATFORMS.filter((p) => p.name.toLowerCase().includes(q)) : PLATFORMS;
  }, [pSearch]);

  const categories = useMemo(() => {
    if (!platformId) return [];
    const set = new Set(SERVICES.filter((s) => s.categoryId === platformId).map((s) => s.group));
    const list = ["All Services", ...Array.from(set)];
    const q = cSearch.trim().toLowerCase();
    return q ? list.filter((c) => c.toLowerCase().includes(q)) : list;
  }, [platformId, cSearch]);

  const services = useMemo(() => {
    if (!platformId) return [];
    const list = SERVICES.filter((s) => s.categoryId === platformId);
    const filtered = group ? list.filter((s) => s.group === group) : list;
    const q = sSearch.trim().toLowerCase();
    return q ? filtered.filter((s) => s.name.toLowerCase().includes(q)) : filtered;
  }, [platformId, group, sSearch]);

  const quantity = Number(qty) || 0;
  const total = service && quantity > 0 ? (service.ratePer1000 / 1000) * quantity : 0;
  const shortfall = total > 0 && total > balance ? total - balance : 0;
  const insufficient = shortfall > 0;
  const inRange = service ? quantity >= service.min && quantity <= service.max : false;
  const canOrder = !!service && link.trim().length > 5 && quantity > 0 && inRange && !insufficient;

  function selectPlatform(id: string) {
    if (id !== platformId) {
      setPlatformId(id);
      setGroup(null);
      setServiceId(null);
    }
    setPSearch("");
    setPicker(null);
  }

  async function pasteLink() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setLink(text.trim());
    } catch {
      /* clipboard unavailable */
    }
  }

  function placeOrder() {
    if (!canOrder || !service) return;
    setPlaced((prev) => [
      { id: "ORD-" + Date.now().toString().slice(-6), service: service.name, speed: service.speed, qty: quantity, total, status: "Pending", link: link.trim() },
      ...prev,
    ]);
    setLink("");
    setQty("");
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-28">
      {/* header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur">
        <button type="button" onClick={() => history.back()} className="flex items-center gap-1 text-[14px] font-medium text-slate-900">
          <ArrowLeft size={18} />
          Back
        </button>
        <h1 className="text-[14px] font-semibold text-slate-900">Boost Account</h1>
        <Link href="/fund" className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700 tabular-nums">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {formatNaira(balance)}
        </Link>
      </header>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {/* promo banner */}
        <section className="rounded-2xl bg-gradient-to-br from-[#0B1220] to-[#1B2B45] px-5 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Rocket size={20} className="text-white" />
            </span>
            <div>
              <h2 className="text-[16px] font-bold leading-tight text-white">Boost Your Account</h2>
              <p className="mt-0.5 text-[12px] text-slate-300">Get followers, likes, views &amp; more — instantly</p>
            </div>
          </div>
        </section>

        {/* wallet balance strip */}
        <section className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet size={17} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Wallet Balance</p>
              <p className="text-[15px] font-bold text-emerald-600 tabular-nums">{formatNaira(balance)}</p>
            </div>
          </div>
          <Link href="/fund" className="rounded-xl bg-slate-900 px-4 py-2 text-[12px] font-semibold text-white active:opacity-80">
            Fund
          </Link>
        </section>

        {/* quick tip */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <Info size={15} className="mt-0.5 shrink-0 text-[#1877F2]" />
          <p className="text-[12px] leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">Quick Tip:</span> Select a platform, pick a category, choose a service, then enter your link and quantity.
          </p>
        </div>

        {/* form */}
        <section className="space-y-4">
          <FormRow
            label="Platform"
            value={platform ? platform.name : null}
            placeholder="Select a platform"
            icon={<GraduationCap size={16} />}
            onClick={() => setPicker("platform")}
          />
          <FormRow
            label="Category"
            value={platformId ? (group ?? "All Services") : null}
            placeholder={platformId ? "All Services" : "Select a platform first"}
            icon={<Folder size={16} />}
            onClick={() => platformId && setPicker("category")}
          />
          <FormRow
            label="Service"
            value={service ? service.name : null}
            placeholder={platformId ? "Select a service" : "Select a platform first"}
            icon={<Star size={16} />}
            onClick={() => platformId && setPicker("service")}
          />

          {/* details */}
          {service && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
              <Label>Details</Label>
              <div className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://instagram.com/p/yourpost/"
                    className="h-[48px] w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-[#1877F2]/10"
                  />
                </div>
                <button type="button" onClick={pasteLink} className="flex h-[48px] shrink-0 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-[12px] font-semibold text-white active:opacity-80">
                  <ClipboardPaste size={14} />
                  Paste
                </button>
              </div>
              <div>
                <div className="flex h-[48px] items-center rounded-xl border border-slate-200 bg-slate-50 pl-4">
                  <span className="text-[14px] font-semibold text-slate-400">#</span>
                  <input
                    value={qty}
                    onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
                    inputMode="numeric"
                    placeholder="Enter quantity"
                    className="h-full w-full bg-transparent px-2 text-[14px] font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                  />
                  {qty && (
                    <button type="button" onClick={() => setQty("")} className="px-3 text-slate-400">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 px-1 text-[11px] text-slate-400 tabular-nums">
                  Min: {service.min.toLocaleString()} – Max: {service.max.toLocaleString()}
                </p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {QTY_CHIPS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQty(String(q))}
                      disabled={q < service.min || q > service.max}
                      className={
                        "h-9 rounded-xl border text-[12px] font-semibold tabular-nums transition-colors disabled:opacity-30 " +
                        (Number(qty) === q ? "border-[#1877F2] bg-[#1877F2] text-white" : "border-slate-200 bg-white text-slate-600")
                      }
                    >
                      {q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* order summary — always visible */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <Label>Order Summary</Label>
              {service && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <Zap size={11} /> {service.speed}
                </span>
              )}
            </div>

            {!service || quantity === 0 ? (
              <div className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <ListOrdered size={16} />
                </span>
                <p className="text-[12px] text-slate-400">Select a service and enter quantity to see price</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Rate per 1,000</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{formatNaira(service.ratePer1000)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{quantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Min / Max</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {service.min.toLocaleString()} – {service.max.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-[#0B1220] to-[#1B2B45] px-5 py-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">Total Cost</p>
                <p className="mt-1 text-[26px] font-bold leading-none text-white tabular-nums">{formatNaira(total)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Wallet</p>
                <p className="text-[13px] font-semibold text-emerald-400 tabular-nums">{formatNaira(balance)}</p>
              </div>
            </div>

            {service && quantity > 0 && !inRange ? (
              <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-[12px] text-amber-300">
                Qty must be {service.min.toLocaleString()}–{service.max.toLocaleString()}
              </p>
            ) : null}

            {insufficient ? (
              <Link href="/fund" className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-[13px] font-semibold text-white active:opacity-90">
                Fund Wallet · Need {formatNaira(shortfall)}
              </Link>
            ) : (
              <button
                type="button"
                disabled={!canOrder}
                onClick={placeOrder}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-[13px] font-semibold text-white transition-opacity disabled:opacity-40"
              >
                <Zap size={15} />
                Place Order
              </button>
            )}
          </div>
        </section>

        {/* my orders table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <span className="text-[13px] font-semibold text-slate-900">My Orders</span>
            <button type="button" onClick={() => setPlaced((p) => [...p])} className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 active:opacity-70">
              <RefreshCw size={14} />
            </button>
          </div>

          {placed.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-[12px] text-slate-400">No orders yet — your boost orders will appear here</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-[1fr_52px_76px_58px] gap-2 border-b border-slate-100 px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">
                <span>Service</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Cost</span>
                <span className="text-right">Status</span>
              </div>
              {placed.map((o) => (
                <div key={o.id} className="grid grid-cols-[1fr_52px_76px_58px] items-start gap-2 border-b border-slate-50 px-5 py-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium leading-snug text-slate-900">{o.service}</p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400 tabular-nums">
                      {o.id} · {o.speed} · {o.link}
                    </p>
                  </div>
                  <span className="pt-0.5 text-right text-[12px] text-slate-600 tabular-nums">{o.qty.toLocaleString()}</span>
                  <span className="pt-0.5 text-right text-[12px] font-semibold text-[#1877F2] tabular-nums">{formatNaira(o.total)}</span>
                  <span className="pt-0.5 text-right">
                    <span className="inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{o.status}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ------------------------------ pickers ------------------------------ */}
      <PickerPage title="Select Platform" open={picker === "platform"} onClose={() => { setPicker(null); setPSearch(""); }} search={pSearch} onSearch={setPSearch}>
        {filteredPlatforms.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => selectPlatform(p.id)}
            className={"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors " + (platformId === p.id ? "bg-blue-50" : "hover:bg-slate-50")}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-[12px] font-bold text-white" style={{ background: p.color }}>
              {p.initial}
            </span>
            <span className="flex-1 truncate text-[14px] font-medium text-slate-900">{p.name}</span>
            <span className="text-[11px] text-slate-400 tabular-nums">{SERVICES.filter((s) => s.categoryId === p.id).length} services</span>
            {platformId === p.id && <Check size={16} className="shrink-0 text-[#1877F2]" />}
          </button>
        ))}
        {filteredPlatforms.length === 0 && <p className="py-10 text-center text-[13px] text-slate-400">No results</p>}
      </PickerPage>

      <PickerPage title="Select Category" open={picker === "category"} onClose={() => { setPicker(null); setCSearch(""); }} search={cSearch} onSearch={setCSearch}>
        {categories.map((c) => {
          const active = (group ?? "All Services") === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => { setGroup(c === "All Services" ? null : c); setServiceId(null); setCSearch(""); setPicker(null); }}
              className={"flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors " + (active ? "bg-blue-50" : "hover:bg-slate-50")}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1877F2]">
                <Folder size={16} />
              </span>
              <span className="flex-1 truncate text-[14px] font-medium text-slate-900">{c}</span>
              {active && <Check size={16} className="shrink-0 text-[#1877F2]" />}
            </button>
          );
        })}
        {categories.length === 0 && <p className="py-10 text-center text-[13px] text-slate-400">No results</p>}
      </PickerPage>

      <PickerPage title="Select Service" open={picker === "service"} onClose={() => { setPicker(null); setSSearch(""); }} search={sSearch} onSearch={setSSearch}>
        {services.map((s) => {
          const active = serviceId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => { setServiceId(s.id); setSSearch(""); setPicker(null); }}
              className={"w-full rounded-xl border p-3.5 text-left transition-colors " + (active ? "border-[#1877F2] bg-blue-50/60" : "border-transparent hover:border-slate-200")}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1 text-[13px] font-semibold leading-snug text-slate-900">
                  <Check size={13} className={"mr-1.5 inline " + (active ? "text-[#1877F2]" : "text-emerald-500")} />
                  {s.name}
                </p>
                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-[#1877F2] tabular-nums">
                  {formatNaira(s.ratePer1000)} / 1K
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 tabular-nums">
                Speed: {s.speed} · Min: {s.min.toLocaleString()} · Max: {s.max.toLocaleString()}
              </p>
            </button>
          );
        })}
        {services.length === 0 && <p className="py-10 text-center text-[13px] text-slate-400">No results</p>}
      </PickerPage>
    </div>
  );
}
