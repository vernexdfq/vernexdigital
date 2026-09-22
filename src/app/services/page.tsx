"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Plane,
  ShoppingBag,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
} from "lucide-react";

const services = [
  {
    href: "/services/flights",
    label: "Flight Booking",
    desc: "Search and book flights for your next trip.",
    icon: Plane,
  },
  {
    href: "/services/shopping",
    label: "Shopping",
    desc: "Shop products and manage purchases in one place.",
    icon: ShoppingBag,
  },
];

const INTERVAL_MS = 3500;

const adSlides = [
  {
    title: "iPhone 17 Pro Max is out now",
    subtitle: "Grab yours — latest Apple flagship ready to ship",
    cta: "Shop Phones",
    href: "/services/shopping",
    icon: Smartphone,
    gradient: "from-[#1877F2] to-[#0A5DC4]",
  },
  {
    title: "Your first laptop upgrade",
    subtitle: "Powerful machines for work, school & creative flow",
    cta: "Shop Laptops",
    href: "/services/shopping",
    icon: Laptop,
    gradient: "from-[#0F766E] to-[#115E59]",
  },
  {
    title: "AirPods & earbuds drop",
    subtitle: "Crystal clear sound · noise cancel · all-day battery",
    cta: "Shop Audio",
    href: "/services/shopping",
    icon: Headphones,
    gradient: "from-[#7C3AED] to-[#5B21B6]",
  },
  {
    title: "Smartwatches that keep up",
    subtitle: "Fitness, calls & notifications on your wrist",
    cta: "Shop Wearables",
    href: "/services/shopping",
    icon: Watch,
    gradient: "from-[#BE185D] to-[#9D174D]",
  },
  {
    title: "Your next flight is on the way",
    subtitle: "Book anywhere you want to go — competitive fares",
    cta: "Book Flight",
    href: "/services/flights",
    icon: Plane,
    gradient: "from-[#0369A1] to-[#0C4A6E]",
  },
  {
    title: "Gadgets & accessories",
    subtitle: "Phones, chargers, cases, power banks & more",
    cta: "Explore Shop",
    href: "/services/shopping",
    icon: ShoppingBag,
    gradient: "from-[#B45309] to-[#92400E]",
  },
];

function ServicesPromoCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % adSlides.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, next]);

  const slide = adSlides[index];
  const Icon = slide.icon;

  return (
    <div
      className="relative overflow-hidden rounded-[14px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <Link
        href={slide.href}
        className={`block bg-gradient-to-r ${slide.gradient} text-white p-5 min-h-[132px] transition-opacity duration-500`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-[12px] bg-white/20 flex items-center justify-center shrink-0">
            <Icon size={24} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold leading-snug">{slide.title}</h3>
            <p className="mt-1 text-[12px] text-white/85 leading-relaxed line-clamp-2">
              {slide.subtitle}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 transition-colors">
              {slide.cta}
              <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </Link>

      <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5">
        {adSlides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-4 bg-white" : "w-1.5 bg-white/40"
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
      <header className="px-4 pt-7 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1877F2]">
          Vernex Digital
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0F172A]">
          Services
        </h1>
        <p className="mt-1 text-sm text-[#64748B]">
          Choose a service to continue
        </p>
      </header>

      <main className="px-4 space-y-5">
        {/* Flight + Shopping side by side on all screens */}
        <div className="grid grid-cols-2 gap-3">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.href}
                href={service.href}
                className="group flex flex-col justify-between rounded-[14px] border border-[#DCE3EC] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#1877F2]/40 hover:shadow-[0_10px_24px_rgba(15,23,42,0.07)] min-h-[168px]"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[11px] bg-[#EFF6FF] text-[#1877F2]">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <h2 className="mt-4 text-[15px] font-bold tracking-tight text-[#0F172A] leading-snug">
                    {service.label}
                  </h2>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#64748B] line-clamp-3">
                    {service.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[12px] font-semibold text-[#1877F2]">
                  Explore
                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Auto-scrolling gadget / flight promo banners */}
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase mb-2.5">
            Featured
          </p>
          <ServicesPromoCarousel />
        </div>
      </main>
    </div>
  );
}
