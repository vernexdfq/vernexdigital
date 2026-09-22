"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

const INTERVAL_MS = 4500;

const slides = [
  {
    href: "/services/shopping",
    eyebrow: "New in shop",
    title: "Upgrade your everyday tech",
    subtitle: "Phones, laptops and accessories — selected products, delivered to you.",
    cta: "Shop now",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85",
    position: "center",
  },
  {
    href: "/services/shopping",
    eyebrow: "Work smarter",
    title: "A better laptop starts here",
    subtitle: "Find dependable machines for work, school and creative projects.",
    cta: "Browse laptops",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85",
    position: "center",
  },
  {
    href: "/services/shopping",
    eyebrow: "Audio drop",
    title: "Bring better sound with you",
    subtitle: "Wireless earbuds and audio essentials for your daily routine.",
    cta: "Shop audio",
    image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=1200&q=85",
    position: "center",
  },
  {
    href: "/services/flights",
    eyebrow: "Travel",
    title: "Your next trip starts here",
    subtitle: "Search flights and keep your travel plans moving from one place.",
    cta: "Book a flight",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85",
    position: "center",
  },
  {
    href: "/services/shopping",
    eyebrow: "Everyday essentials",
    title: "The accessories you actually use",
    subtitle: "Chargers, watches, power and practical tech for everyday life.",
    cta: "Explore shop",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85",
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
    <section aria-label="Featured offers">
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
