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

/** Services exclusive to this page (not home quick actions) */
const services = [
  {
    href: "/services/flights",
    label: "Flight Booking",
    desc: "Search and book flights for your next trip with competitive fares.",
    icon: Plane,
    accent: "from-[#EFF6FF] to-[#DBEAFE]",
    iconColor: "text-[#1877F2]",
    tag: "Travel",
  },
  {
    href: "/services/shopping",
    label: "Shopping",
    desc: "Phones, laptops, gadgets and accessories — delivered fast.",
    icon: ShoppingBag,
    accent: "from-[#F0FDF4] to-[#DCFCE7]",
    iconColor: "text-emerald-600",
    tag: "Retail",
  },
  {
    href: "/services/cable-tv",
    label: "Cable TV",
    desc: "Pay DSTV, GOtv, Startimes and Showmax from your wallet.",
    icon: Tv,
    accent: "from-[#FFF1F2] to-[#FFE4E6]",
    iconColor: "text-rose-600",
    tag: "Bills",
  },
  {
    href: "/services/gaming",
    label: "Gaming Top-up",
    desc: "Fund Steam, PlayStation, Xbox, Free Fire and more instantly.",
    icon: Gamepad2,
    accent: "from-[#F5F3FF] to-[#EDE9FE]",
    iconColor: "text-violet-600",
    tag: "Gaming",
  },
  {
    href: "/services/electricity",
    label: "Electricity",
    desc: "Buy prepaid units for any disco — token delivered in seconds.",
    icon: Zap,
    accent: "from-[#FFFBEB] to-[#FEF3C7]",
    iconColor: "text-amber-600",
    tag: "Utility",
  },
];

const INTERVAL_MS = 3800;

const adSlides = [
  {
    title: "Your next flight is on the way",
    subtitle: "Book domestic & international routes — competitive fares",
    cta: "Book Flight",
    href: "/services/flights",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=88",
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
    title: "Level up your game",
    subtitle: "Steam, PlayStation, Xbox & mobile game credits",
    cta: "Top up Gaming",
    href: "/services/gaming",
    image:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=88",
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
          Bills, travel, shopping and more
        </p>
      </header>

      <main className="px-4 pt-5 space-y-5">
        {/* Professional list cards — distinct from home quick actions */}
        <div className="space-y-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.href}
                href={service.href}
                className="group flex items-center gap-3.5 rounded-[16px] border border-[#E2E8F0] bg-white p-3.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition-all hover:border-[#1877F2]/30 hover:shadow-[0_8px_22px_rgba(15,23,42,0.07)] active:scale-[0.99]"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${service.accent}`}
                >
                  <Icon size={24} strokeWidth={1.8} className={service.iconColor} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#0F172A]">
                      {service.label}
                    </h2>
                    <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#64748B]">
                      {service.tag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#64748B] line-clamp-2">
                    {service.desc}
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8FAFC] text-[#1877F2] transition group-hover:bg-[#EFF6FF]">
                  <ArrowRight size={16} />
                </div>
              </Link>
            );
          })}
        </div>

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
