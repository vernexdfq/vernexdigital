"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plane,
  ShoppingBag,
  Smartphone,
  Wifi,
  Tv,
  Phone,
  Rocket,
  Gift,
  CreditCard,
  PhoneCall,
  FileText,
} from "lucide-react";

/** Compact service tiles — VTU + digital + travel/shop */
const services = [
  {
    href: "/services/airtime",
    label: "Airtime",
    desc: "Top up any network",
    icon: Smartphone,
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/services/data",
    label: "Data",
    desc: "Buy data bundles",
    icon: Wifi,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    href: "/services/cable-tv",
    label: "Cable TV",
    desc: "DSTV, GOtv & more",
    icon: Tv,
    color: "bg-rose-50 text-rose-600",
  },
  {
    href: "/services/virtual-number",
    label: "Virtual Number",
    desc: "SMS verification",
    icon: Phone,
    color: "bg-sky-50 text-sky-600",
  },
  {
    href: "/services/boost",
    label: "Boost",
    desc: "Followers & views",
    icon: Rocket,
    color: "bg-violet-50 text-violet-600",
  },
  {
    href: "/services/gift-card",
    label: "Gift Card",
    desc: "Buy or sell cards",
    icon: Gift,
    color: "bg-pink-50 text-pink-600",
  },
  {
    href: "/services/virtual-card",
    label: "Virtual Card",
    desc: "USD virtual cards",
    icon: CreditCard,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/services/rent-number",
    label: "Rent Number",
    desc: "Rent a line",
    icon: PhoneCall,
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    href: "/services/logs",
    label: "Buy Logs",
    desc: "Account logs",
    icon: FileText,
    color: "bg-amber-50 text-amber-600",
  },
  {
    href: "/services/flights",
    label: "Flights",
    desc: "Book flights",
    icon: Plane,
    color: "bg-[#EFF6FF] text-[#1877F2]",
  },
  {
    href: "/services/shopping",
    label: "Shopping",
    desc: "Shop products",
    icon: ShoppingBag,
    color: "bg-[#EFF6FF] text-[#1877F2]",
  },
];

const INTERVAL_MS = 3500;

const adSlides = [
  {
    title: "iPhone 17 Pro Max is out now",
    subtitle: "Grab yours — latest Apple flagship ready to ship",
    cta: "Shop Phones",
    href: "/services/shopping",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=88",
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
    title: "AirPods & earbuds drop",
    subtitle: "Crystal clear sound · noise cancel · all-day battery",
    cta: "Shop Audio",
    href: "/services/shopping",
    image:
      "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    title: "Smartwatches that keep up",
    subtitle: "Fitness, calls & notifications on your wrist",
    cta: "Shop Wearables",
    href: "/services/shopping",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    title: "Your next flight is on the way",
    subtitle: "Book anywhere you want to go — competitive fares",
    cta: "Book Flight",
    href: "/services/flights",
    image:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    title: "Gadgets & accessories",
    subtitle: "Phones, chargers, cases, power banks & more",
    cta: "Explore Shop",
    href: "/services/shopping",
    image:
      "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&w=1200&q=88",
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
    <div className="min-h-screen bg-white pb-24">
      <header className="px-4 pt-7 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1877F2]">
          Vernex Digital
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0F172A]">
          Services
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">Choose a service to continue</p>
      </header>

      <main className="px-4 space-y-5">
        {/* Compact 3-column service grid */}
        <div className="grid grid-cols-3 gap-2.5">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.href}
                href={service.href}
                className="group flex flex-col items-center rounded-[14px] border border-[#E2E8F0] bg-white px-2 py-3.5 text-center shadow-[0_4px_12px_rgba(15,23,42,0.03)] transition-all hover:-translate-y-0.5 hover:border-[#1877F2]/35 hover:shadow-[0_8px_18px_rgba(15,23,42,0.06)] active:scale-[0.98]"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-[11px] ${service.color}`}
                >
                  <Icon size={20} strokeWidth={1.9} />
                </div>
                <h2 className="mt-2.5 text-[12px] font-bold tracking-tight text-[#0F172A] leading-tight">
                  {service.label}
                </h2>
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#94A3B8]">
                  {service.desc}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Featured banners — unchanged carousel */}
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
