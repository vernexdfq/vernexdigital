"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plane,
  ShoppingBag,
  Tv,
  Gamepad2,
  Zap,
} from "lucide-react";

/** Live wallet services — shown first */
const LIVE_SERVICES = [
  {
    href: "/services/gaming",
    label: "Gaming Top-up",
    desc: "PUBG, Free Fire, Steam, PSN & 137+ more titles",
    icon: Gamepad2,
    accent: "from-[#F5F3FF] to-[#EDE9FE]",
    iconColor: "text-violet-600",
    tag: "Gaming",
  },
  {
    href: "/services/cable-tv",
    label: "Cable TV",
    desc: "DSTV, GOtv, Startimes & Showmax",
    icon: Tv,
    accent: "from-[#FFF1F2] to-[#FFE4E6]",
    iconColor: "text-rose-600",
    tag: "Bills",
  },
  {
    href: "/services/electricity",
    label: "Electricity",
    desc: "Prepaid tokens for any disco",
    icon: Zap,
    accent: "from-[#FFFBEB] to-[#FEF3C7]",
    iconColor: "text-amber-600",
    tag: "Utility",
  },
];

/** Retail & travel services */
const RETAIL_SERVICES = [
  {
    href: "/services/shopping",
    label: "Shopping",
    desc: "Phones, laptops & gadgets",
    icon: ShoppingBag,
    accent: "from-[#F0FDF4] to-[#DCFCE7]",
    iconColor: "text-emerald-600",
    tag: "Retail",
  },
  {
    href: "/services/flights",
    label: "Flight Booking",
    desc: "Flight search & booking — booking flow coming soon",
    icon: Plane,
    accent: "from-[#EFF6FF] to-[#DBEAFE]",
    iconColor: "text-[#1877F2]",
    tag: "Travel",
  },
];

const INTERVAL_MS = 3800;

const adSlides = [
  {
    title: "Level up your game",
    subtitle: "Steam, PlayStation, Xbox & mobile game credits",
    cta: "Top up Gaming",
    href: "/services/gaming",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    title: "iPhone 17 Pro Max is out now",
    subtitle: "Latest flagship phones and gadgets ready to ship",
    cta: "Shop Phones",
    href: "/services/shopping",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    title: "Never miss your favourite shows",
    subtitle: "DSTV, GOtv & Startimes — pay in seconds from your wallet",
    cta: "Pay Cable TV",
    href: "/services/cable-tv",
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    title: "Power on in seconds",
    subtitle: "Prepaid electricity tokens for every disco in Nigeria",
    cta: "Buy Electricity",
    href: "/services/electricity",
    image:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    title: "Your first laptop upgrade",
    subtitle: "Powerful machines for work, school & creative flow",
    cta: "Shop Laptops",
    href: "/services/shopping",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },

  {
    title: "Your next flight is on the way",
    subtitle: "Book domestic & international routes — competitive fares",
    cta: "Book Flight",
    href: "/services/flights",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
];

function ServicesPromoCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  const go = useCallback((nextIndex: number) => {
    setIndex((nextIndex + adSlides.length) % adSlides.length);
  }, []);

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (paused || dragging) return;
    const timer = window.setInterval(next, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [dragging, next, paused]);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    startX.current = event.clientX;
    moved.current = false;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    if (Math.abs(event.clientX - startX.current) > 10) moved.current = true;
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return;
    const distance = event.clientX - startX.current;
    startX.current = null;
    setDragging(false);
    if (Math.abs(distance) > 45) {
      if (distance < 0) next();
      else prev();
    }
  }

  function onClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (moved.current) {
      event.preventDefault();
      event.stopPropagation();
      moved.current = false;
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-[18px] border border-[#E2E8F0] bg-[#0B1F4D] shadow-[0_12px_30px_rgba(15,23,42,0.10)] touch-pan-y select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClickCapture={onClickCapture}
    >
      <div
        className="flex will-change-transform"
        style={{
          transform: `translate3d(-${index * 100}%, 0, 0)`,
          transition: dragging
            ? "none"
            : "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {adSlides.map((slide) => (
          <Link
            key={slide.title}
            href={slide.href}
            className="relative block w-full min-w-full min-h-[176px] overflow-hidden bg-[#0B1F4D] text-white sm:min-h-[196px]"
            draggable={false}
          >
            <div
              className="absolute inset-0 bg-cover bg-no-repeat"
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundPosition: slide.position,
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,13,31,0.92)_0%,rgba(5,13,31,0.70)_48%,rgba(5,13,31,0.16)_100%)]" />
            <div className="relative z-10 flex min-h-[176px] items-end p-4 sm:min-h-[196px] sm:p-5">
              <div className="max-w-[80%] sm:max-w-[64%]">
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  Featured
                </span>
                <h3 className="mt-2 text-[18px] font-bold leading-[1.1] tracking-tight sm:text-[21px]">
                  {slide.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/80 sm:text-xs">
                  {slide.subtitle}
                </p>
                <span className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[11px] font-semibold text-[#0B1F4D] shadow-sm">
                  {slide.cta}
                  <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <button
        type="button"
        aria-label="Previous featured advertisement"
        onClick={(event) => {
          event.stopPropagation();
          prev();
        }}
        className="absolute left-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 sm:flex"
      >
        <ChevronLeft size={17} />
      </button>
      <button
        type="button"
        aria-label="Next featured advertisement"
        onClick={(event) => {
          event.stopPropagation();
          next();
        }}
        className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 sm:flex"
      >
        <ChevronRight size={17} />
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
        {adSlides.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            aria-label={`Show featured advertisement ${i + 1}`}
            onClick={(event) => {
              event.stopPropagation();
              go(i);
            }}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/45"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <header className="bg-white px-4 pt-7 pb-5 border-b border-[#E2E8F0]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1877F2]">
          Vernex Digital
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0F172A]">
          Services
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Instant top-ups, bills and shopping
        </p>
      </header>

      <main className="px-4 pt-5 space-y-5">
        {/* All services — compact 3-per-row tiles, old-Verxor style */}
        {[
          { label: "Popular Services", items: LIVE_SERVICES },
          { label: "Additional Services", items: RETAIL_SERVICES },
        ].map((group) => {
          const items = group.items;
          return (
            <section key={group.label}>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-[#64748B]">
                {group.label}
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {items.map((service) => {
                  const Icon = service.icon;
                  const soon = service.href === "/services/flights";
                  return (
                    <Link
                      key={service.href}
                      href={service.href}
                      className="group flex min-h-[118px] flex-col items-center justify-center gap-2 rounded-[16px] border border-[#E2E8F0] bg-white px-2 py-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-[#CBD5E1] hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] active:scale-[0.97]"
                    >
                      <div
                        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${service.accent}`}
                      >
                        <Icon size={20} strokeWidth={1.9} className={service.iconColor} />
                        {soon && (
                          <span className="absolute -top-1.5 -right-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-[8px] font-extrabold leading-[1.2] tracking-wide text-white">
                            SOON
                          </span>
                        )}
                      </div>
                      <div className="w-full">
                        <h2 className="text-[11px] font-semibold leading-[13px] text-[#334155] line-clamp-2">
                          {service.label}
                        </h2>
                        <p className="mt-1 text-[9px] leading-[1.3] text-[#64748B] line-clamp-2">
                          {service.desc}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Featured ad strip */}
        <div>
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
            Featured
          </p>
          <ServicesPromoCarousel />
        </div>
      </main>
    </div>
  );
}
