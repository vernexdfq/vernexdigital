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
  ChevronRight,
  ChevronDown,
  Package,
  ClipboardPaste,
  ShieldCheck,
  Zap,
  Lock,
  RefreshCw,
  BadgeCheck,
  TrendingUp,
} from "lucide-react";

/* ---------------------------------- data ---------------------------------- */
/* Same data model as before — swap these arrays for provider API responses later. */

type Platform = {
  id: string;
  name: string;
  color: string; // brand color for the tile
  initial: string;
};

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
  group: string; // Followers / Likes / Views ...
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

function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{children}</span>
      {hint ? <span className="text-[11px] text-slate-400 tabular-nums">{hint}</span> : null}
    </div>
  );
}

function SelectRow({
  label,
  value,
  placeholder,
  icon,
  right,
  onClick,
  disabled,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={
          "w-full min-h-[56px] rounded-2xl border bg-white px-4 py-3 text-left transition-colors " +
          (disabled
            ? "border-slate-100 opacity-50"
            : "border-slate-200 hover:border-slate-300 active:border-[#1877F2]")
        }
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {icon}
            <span
              className={
                "truncate text-[14px] font-medium leading-snug " +
                (value ? "text-slate-900" : "text-slate-400 font-normal")
              }
            >
              {value ?? placeholder}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {right}
            <ChevronDown size={16} className="text-slate-400" />
          </div>
        </div>
      </button>
    </div>
  );
}

function Sheet({
  title,
  open,
  onClose,
  search,
  onSearch,
  searchPlaceholder,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" />
      <div className="relative flex max-h-[82vh] flex-col rounded-t-[24px] bg-white shadow-2xl">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h3 className="text-[16px] font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-[#1877F2]/10"
            />
          </div>
        </div>
        <div className="max-h-[58vh] overflow-y-auto px-3 pb-7">{children}</div>
      </div>
    </div>
  );
}

function PlatformBadge({ platform, size = 40 }: { platform: Platform; size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-xl text-[12px] font-bold text-white"
      style={{ background: platform.color, width: size, height: size, fontSize: size >= 40 ? 13 : 11 }}
    >
      {platform.initial}
    </span>
  );
}

/* ---------------------------------- page ---------------------------------- */

export default function BoostAccountPage() {
  const { wallet } = useUser();
  const balance = wallet.balance;

  const [platformId, setPlatformId] = useState<string | null>(null);
  const [group, setGroup] = useState<string>("All Services");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");
  const [placed, setPlaced] = useState<{ id: string; service: string; qty: number; total: number; status: string }[]>([]);

  const [platformOpen, setPlatformOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [pSearch, setPSearch] = useState("");
  const [sSearch, setSSearch] = useState("");

  const platform = PLATFORMS.find((p) => p.id === platformId) ?? null;
  const service = SERVICES.find((s) => s.id === serviceId) ?? null;

  const filteredPlatforms = useMemo(() => {
    const q = pSearch.trim().toLowerCase();
    return q ? PLATFORMS.filter((p) => p.name.toLowerCase().includes(q)) : PLATFORMS;
  }, [pSearch]);

  const groups = useMemo(() => {
    if (!platformId) return [];
    const set = new Set(SERVICES.filter((s) => s.categoryId === platformId).map((s) => s.group));
    return ["All Services", ...Array.from(set)];
  }, [platformId]);

  const platformServices = useMemo(() => {
    const list = platformId ? SERVICES.filter((s) => s.categoryId === platformId) : SERVICES;
    const q = sSearch.trim().toLowerCase();
    const filtered = group === "All Services" ? list : list.filter((s) => s.group === group);
    return q ? filtered.filter((s) => s.name.toLowerCase().includes(q)) : filtered;
  }, [platformId, group, sSearch]);

  const quantity = Number(qty) || 0;
  const total = service && quantity > 0 ? (service.ratePer1000 / 1000) * quantity : 0;
  const shortfall = total > 0 && total > balance ? total - balance : 0;
  const insufficient = shortfall > 0;
  const canOrder =
    !!service && link.trim().length > 5 && quantity >= (service?.min ?? 0) && quantity <= (service?.max ?? 0) && !insufficient;

  function selectPlatform(id: string) {
    setPlatformId(id);
    setServiceId(null);
    setGroup("All Services");
    setPlatformOpen(false);
    setPSearch("");
  }

  async function pasteLink() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setLink(text.trim());
    } catch {
      /* clipboard unavailable — user can still type */
    }
  }

  function placeOrder() {
    if (!canOrder || !service) return;
    setPlaced((prev) => [
      { id: "ORD-" + Date.now().toString().slice(-6), service: service.name, qty: quantity, total, status: "Pending" },
      ...prev,
    ]);
    setLink("");
    setQty("");
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-32">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <button type="button" onClick={() => history.back()} className="flex items-center gap-1 text-[14px] font-medium text-slate-900">
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 className="text-[14px] font-semibold text-slate-900">Boost Account</h1>
          <Link href="/fund" className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700 tabular-nums">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {formatNaira(balance)}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-5">
        {/* hero */}
        <section>
          <h2 className="text-[22px] font-bold leading-tight tracking-tight text-slate-900">Boost Your Account</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            Social media growth &amp; engagement. Select a platform, pick a category, choose a service, then enter your link and quantity.
          </p>
        </section>

        {/* selectors */}
        <section className="space-y-4">
          <SelectRow
            label="Platform"
            value={platform ? platform.name : null}
            placeholder="Select a platform"
            onClick={() => setPlatformOpen(true)}
            icon={
              platform ? (
                <PlatformBadge platform={platform} size={36} />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                  <TrendingUp size={16} />
                </span>
              )
            }
            right={platform ? <Check size={16} className="text-[#1877F2]" /> : null}
          />

          {platform && (
            <SelectRow
              label="Category"
              value={group}
              placeholder="Select a category"
              onClick={() => setGroupOpen(true)}
              icon={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#1877F2]">
                  <BadgeCheck size={16} />
                </span>
              }
            />
          )}

          {platform && (
            <SelectRow
              label="Service"
              value={service ? service.name : null}
              placeholder="Select a service"
              onClick={() => setServiceOpen(true)}
              icon={
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Package size={16} />
                </span>
              }
              right={
                service ? (
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-[#1877F2] tabular-nums">
                    {formatNaira(service.ratePer1000)} / 1K
                  </span>
                ) : null
              }
            />
          )}
        </section>

        {/* details */}
        {service && (
          <section className="space-y-4">
            <div>
              <SectionLabel>Link</SectionLabel>
              <div className="flex items-stretch gap-2">
                <div className="relative flex-1">
                  <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Paste your post or profile link"
                    className="h-[52px] w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none focus:ring-2 focus:ring-[#1877F2]/10"
                  />
                </div>
                <button
                  type="button"
                  onClick={pasteLink}
                  className="flex h-[52px] shrink-0 items-center gap-1.5 rounded-2xl bg-slate-900 px-4 text-[13px] font-semibold text-white active:opacity-80"
                >
                  <ClipboardPaste size={15} />
                  Paste
                </button>
              </div>
            </div>

            <div>
              <SectionLabel hint={"Min " + service.min.toLocaleString() + " · Max " + service.max.toLocaleString()}>Quantity</SectionLabel>
              <div className="flex h-[52px] items-center rounded-2xl border border-slate-200 bg-white pl-4">
                <span className="text-[15px] font-semibold text-slate-400">#</span>
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  placeholder="0"
                  className="h-full w-full bg-transparent px-2 text-[15px] font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none"
                />
                {qty && <button type="button" onClick={() => setQty("")} className="px-3 text-slate-400"><X size={14} /></button>}
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {QTY_CHIPS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQty(String(q))}
                    disabled={q < service.min || q > service.max}
                    className={
                      "h-9 rounded-xl border text-[12px] font-semibold tabular-nums transition-colors disabled:opacity-30 " +
                      (Number(qty) === q
                        ? "border-[#1877F2] bg-[#1877F2] text-white"
                        : "border-slate-200 bg-white text-slate-600")
                    }
                  >
                    {q.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* order summary */}
        {service && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Order Summary</span>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <Zap size={11} /> {service.speed}
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Rate per 1,000</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{formatNaira(service.ratePer1000)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-500">Quantity</span>
                  <span className="font-semibold text-slate-900 tabular-nums">{quantity.toLocaleString()}</span>
                </div>
              </div>
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

              {insufficient ? (
                <Link
                  href="/fund"
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-[13px] font-semibold text-white active:opacity-90"
                >
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
        )}

        {/* trust */}
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#1877F2]" />
            <h3 className="text-[14px] font-semibold text-slate-900">Vernex Boost Guarantee</h3>
          </div>
          <ul className="mt-3 space-y-2.5">
            {[
              { icon: <Lock size={13} />, text: "100% safe & private — no password required, ever" },
              { icon: <RefreshCw size={13} />, text: "Automatic refill or refund if counts drop" },
              { icon: <Zap size={13} />, text: "Fast delivery — most orders start within minutes" },
              { icon: <ShieldCheck size={13} />, text: "Secure wallet — pay only for what you order" },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-slate-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1877F2]">
                  {item.icon}
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </section>

        {/* recent orders */}
        {placed.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">My Orders</span>
              <Link href="/history" className="flex items-center gap-0.5 text-[12px] font-medium text-[#1877F2]">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {placed.map((o) => (
                <div key={o.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-900">{o.service}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
                        {o.id} · Qty {o.qty.toLocaleString()}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-semibold text-slate-900 tabular-nums">{formatNaira(o.total)}</p>
                      <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        {o.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* sheets */}
      <Sheet
        title="Select Platform"
        open={platformOpen}
        onClose={() => { setPlatformOpen(false); setPSearch(""); }}
        search={pSearch}
        onSearch={setPSearch}
        searchPlaceholder="Search platforms..."
      >
        <div className="grid grid-cols-2 gap-2">
          {filteredPlatforms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPlatform(p.id)}
              className={
                "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors " +
                (platformId === p.id
                  ? "border-[#1877F2] bg-blue-50/60"
                  : "border-slate-100 bg-white hover:border-slate-300")
              }
            >
              <PlatformBadge platform={p} size={38} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900">{p.name}</p>
                <p className="text-[11px] text-slate-400">
                  {SERVICES.filter((s) => s.categoryId === p.id).length} services
                </p>
              </div>
              {platformId === p.id && <Check size={15} className="ml-auto shrink-0 text-[#1877F2]" />}
            </button>
          ))}
        </div>
        {filteredPlatforms.length === 0 && <p className="py-8 text-center text-[13px] text-slate-400">No results</p>}
      </Sheet>

      <Sheet
        title={"Select " + (platform?.name ?? "") + " Category"}
        open={groupOpen}
        onClose={() => setGroupOpen(false)}
        search=""
        onSearch={() => {}}
        searchPlaceholder=""
      >
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => { setGroup(g); setGroupOpen(false); }}
            className={
              "flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left text-[14px] " +
              (group === g ? "bg-blue-50 font-semibold text-[#1877F2]" : "text-slate-700")
            }
          >
            {g}
            {group === g && <Check size={16} className="text-[#1877F2]" />}
          </button>
        ))}
      </Sheet>

      <Sheet
        title={"Select " + (platform?.name ?? "") + " Package"}
        open={serviceOpen}
        onClose={() => { setServiceOpen(false); setSSearch(""); }}
        search={sSearch}
        onSearch={setSSearch}
        searchPlaceholder="Search services..."
      >
        {platformServices.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => { setServiceId(s.id); setServiceOpen(false); setSSearch(""); }}
            className={
              "w-full rounded-xl border p-3.5 text-left transition-colors " +
              (serviceId === s.id ? "border-[#1877F2] bg-blue-50/60" : "border-slate-100 hover:border-slate-300")
            }
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[13px] font-semibold leading-snug text-slate-900">{s.name}</p>
              <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-[#1877F2] tabular-nums">
                {formatNaira(s.ratePer1000)} / 1K
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400 tabular-nums">
              {s.group} · Min {s.min.toLocaleString()} – Max {s.max.toLocaleString()} · {s.speed}
            </p>
          </button>
        ))}
        {platformServices.length === 0 && <p className="py-8 text-center text-[13px] text-slate-400">No results</p>}
      </Sheet>
    </div>
  );
}
