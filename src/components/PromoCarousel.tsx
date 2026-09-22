"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Phone,
  Rocket,
  FileText,
  PhoneCall,
  Wifi,
  Smartphone,
  Gift,
  CreditCard,
  ChevronRight,
} from "lucide-react";

const INTERVAL_MS = 3000;

const slides = [
  {
    href: "/services/virtual-number",
    title: "Virtual Numbers",
    subtitle: "Get OTP numbers in seconds — WhatsApp, Facebook & more",
    cta: "Order Now",
    icon: Phone,
    gradient: "from-[#1877F2] to-[#0A5DC4]",
  },
  {
    href: "/services/boost",
    title: "Boost Account",
    subtitle: "Grow followers, likes & views on every platform",
    cta: "Boost Now",
    icon: Rocket,
    gradient: "from-[#6D28D9] to-[#4C1D95]",
  },
  {
    href: "/services/logs",
    title: "Buy Logs",
    subtitle: "Verified log packs ready for instant delivery",
    cta: "Browse Logs",
    icon: FileText,
    gradient: "from-[#B45309] to-[#92400E]",
  },
  {
    href: "/services/rent-number",
    title: "Rent a Number",
    subtitle: "Call, SMS & manage numbers from one hub",
    cta: "Open Hub",
    icon: PhoneCall,
    gradient: "from-[#0E7490] to-[#155E75]",
  },
  {
    href: "/services/data",
    title: "Data Bundles",
    subtitle: "All networks · Instant delivery · Best rates",
    cta: "Buy Data",
    icon: Wifi,
    gradient: "from-[#4338CA] to-[#312E81]",
  },
  {
    href: "/services/airtime",
    title: "Airtime Top-up",
    subtitle: "Recharge any number in a single tap",
    cta: "Buy Airtime",
    icon: Smartphone,
    gradient: "from-[#1D4ED8] to-[#1E3A8A]",
  },
  {
    href: "/services/gift-card",
    title: "Gift Cards",
    subtitle: "Sell premium cards · Fast Naira settlement",
    cta: "Sell Now",
    icon: Gift,
    gradient: "from-[#BE185D] to-[#9D174D]",
  },
  {
    href: "/services/virtual-card",
    title: "Virtual Dollar Card",
    subtitle: "Get your USD card to verify accounts & pay online today",
    cta: "Get Card",
    icon: CreditCard,
    gradient: "from-[#0F766E] via-[#0D9488] to-[#1877F2]",
    special: true,
  },
];

export default function PromoCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((i: number) => {
    const n = slides.length;
    setIndex(((i % n) + n) % n);
  }, []);

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (paused) return;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, index]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
    setPaused(false);
  }

  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <section>
      <p className="text-[10px] font-semibold tracking-[0.12em] text-[#94A3B8] uppercase mb-2.5">
        Connect | Verify | Grow
      </p>

      <div
        className="relative overflow-hidden rounded-[12px]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Link
          href={slide.href}
          className={`block relative w-full min-h-[112px] bg-gradient-to-r ${slide.gradient} text-white px-4 py-3.5`}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 90% 20%, white 0%, transparent 45%), radial-gradient(circle at 10% 90%, white 0%, transparent 40%)",
            }}
          />

          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-[12px] bg-white/15 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Icon size={22} strokeWidth={1.8} />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`font-bold leading-tight truncate ${
                  slide.special ? "text-[15px]" : "text-sm"
                }`}
              >
                {slide.title}
              </p>
              <p className="text-[11px] text-white/85 mt-0.5 line-clamp-2 leading-snug">
                {slide.subtitle}
              </p>
            </div>

            <span className="shrink-0 inline-flex items-center gap-0.5 h-8 px-3 rounded-full bg-white text-[11px] font-semibold text-[#0F172A] shadow-sm">
              {slide.cta}
              <ChevronRight size={14} />
            </span>
          </div>
        </Link>
      </div>

      <div className="flex justify-center items-center gap-1.5 mt-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-4 bg-[#1877F2]" : "w-1.5 bg-[#CBD5E1]"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
