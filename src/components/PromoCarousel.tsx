"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

const INTERVAL_MS = 4500;

const slides = [
  {
    href: "/services/virtual-number",
    eyebrow: "Virtual Numbers",
    title: "Get a number in seconds",
    subtitle: "OTP numbers for WhatsApp, Telegram and more, delivered fast.",
    cta: "Order now",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    href: "/services/boost",
    eyebrow: "Social Growth",
    title: "Boost your account",
    subtitle: "Grow followers, likes and views with simple digital orders.",
    cta: "Boost now",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    href: "/services/logs",
    eyebrow: "Marketplace",
    title: "Browse digital logs",
    subtitle: "Explore available packs and delivery options in one place.",
    cta: "Browse logs",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    href: "/services/rent-number",
    eyebrow: "Number Rental",
    title: "Rent a number",
    subtitle: "Keep a dedicated line for calls and SMS from one hub.",
    cta: "Open hub",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    href: "/services/data",
    eyebrow: "Data Bundles",
    title: "Stay connected",
    subtitle: "Get mobile data bundles with fast digital delivery.",
    cta: "Buy data",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    href: "/services/airtime",
    eyebrow: "Airtime",
    title: "Top up in one tap",
    subtitle: "Recharge a mobile line quickly from your Vernex wallet.",
    cta: "Buy airtime",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    href: "/services/gift-card",
    eyebrow: "Gift Cards",
    title: "Turn cards into Naira",
    subtitle: "Sell supported gift cards with a straightforward settlement flow.",
    cta: "Sell now",
    image: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
  {
    href: "/services/virtual-card",
    eyebrow: "Virtual Card",
    title: "Pay online with ease",
    subtitle: "Use a virtual card for supported online payments worldwide.",
    cta: "Get card",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=88",
    position: "center",
  },
];

export default function PromoCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const moved = useRef(false);

  const go = useCallback((nextIndex: number) => {
    setIndex((nextIndex + slides.length) % slides.length);
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
    <section aria-label="Vernex service promotions">
      <div
        className="relative overflow-hidden rounded-[16px] border border-[#E2E8F0] bg-[#111827] shadow-[0_10px_30px_rgba(15,23,42,0.10)] touch-pan-y select-none"
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
            transition: dragging ? "none" : "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {slides.map((slide) => (
            <Link
              key={slide.title}
              href={slide.href}
              className="relative block w-full min-w-full min-h-[158px] overflow-hidden bg-slate-900 text-white"
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
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,12,24,0.94)_0%,rgba(7,12,24,0.78)_42%,rgba(7,12,24,0.18)_100%)]" />

              <div className="relative z-10 flex min-h-[158px] items-end p-4 sm:p-5">
                <div className="max-w-[72%] sm:max-w-[58%]">
                  <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm">
                    {slide.eyebrow}
                  </span>
                  <h3 className="mt-2 text-[17px] font-bold leading-[1.12] tracking-tight sm:text-lg">
                    {slide.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/75 sm:text-xs">
                    {slide.subtitle}
                  </p>
                  <span className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[11px] font-semibold text-[#111827] shadow-sm">
                    {slide.cta}
                    <ArrowUpRight size={13} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous advertisement"
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
          aria-label="Next advertisement"
          onClick={(event) => {
            event.stopPropagation();
            next();
          }}
          className="absolute right-2 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 sm:flex"
        >
          <ChevronRight size={17} />
        </button>

        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur-sm">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Show advertisement ${i + 1}`}
              onClick={(event) => {
                event.stopPropagation();
                go(i);
              }}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/45"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
