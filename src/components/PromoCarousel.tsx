"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  Phone,
  Rocket,
  FileText,
  PhoneCall,
  Wifi,
  Smartphone,
  Gift,
  Sparkles,
} from "lucide-react";

const MOTTO = "Connect | Verify | Grow";

const promos = [
  {
    href: "/services/virtual-number",
    title: "Virtual Numbers",
    text: "OTP numbers in seconds",
    icon: Phone,
    accent: "#1877F2",
    bg: "bg-[#1877F2]/8",
  },
  {
    href: "/services/boost",
    title: "Boost Account",
    text: "Grow reach fast",
    icon: Rocket,
    accent: "#7C3AED",
    bg: "bg-violet-50",
  },
  {
    href: "/services/logs",
    title: "Buy Logs",
    text: "Verified log packs",
    icon: FileText,
    accent: "#D97706",
    bg: "bg-amber-50",
  },
  {
    href: "/services/rent-number",
    title: "Rent Number",
    text: "Call & SMS hub",
    icon: PhoneCall,
    accent: "#0891B2",
    bg: "bg-cyan-50",
  },
  {
    href: "/services/data",
    title: "Data Bundles",
    text: "All networks, instant",
    icon: Wifi,
    accent: "#4F46E5",
    bg: "bg-indigo-50",
  },
  {
    href: "/services/airtime",
    title: "Airtime",
    text: "Top-up in a tap",
    icon: Smartphone,
    accent: "#2563EB",
    bg: "bg-blue-50",
  },
  {
    href: "/services/gift-card",
    title: "Gift Cards",
    text: "Coming soon",
    icon: Gift,
    accent: "#DB2777",
    bg: "bg-pink-50",
  },
  {
    href: "/services/lucky-draw",
    title: "WIN AMAZING PRIZES 🎁",
    text: "Lucky Draw",
    icon: Sparkles,
    accent: "#1877F2",
    bg: "bg-gradient-to-br from-[#1877F2]/15 to-amber-50",
    special: true,
    cta: "Enter Now →",
  },
];

export default function PromoCarousel() {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      const cardW = 148; // approx card + gap
      const i = Math.round(el.scrollLeft / cardW);
      setActive(Math.min(Math.max(i, 0), promos.length - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="-mx-4">
      <div className="px-4 flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold tracking-wider text-[#94A3B8] uppercase">
          {MOTTO}
        </p>
      </div>

      <div
        ref={scroller}
        className="flex gap-2.5 overflow-x-auto px-4 pb-1 snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {promos.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className={`snap-start shrink-0 w-[138px] h-[76px] rounded-[10px] border border-[#E2E8F0] ${p.bg} p-2.5 flex flex-col justify-between active:scale-[0.98] transition-transform`}
          >
            <div className="flex items-start justify-between gap-1">
              <p
                className={`text-[11px] font-semibold leading-tight text-[#0F172A] ${
                  p.special ? "text-[10.5px]" : ""
                }`}
              >
                {p.title}
              </p>
              <p.icon size={14} style={{ color: p.accent }} className="shrink-0 mt-0.5" />
            </div>
            <div className="flex items-end justify-between gap-1">
              <p className="text-[10px] text-[#64748B] leading-tight">{p.text}</p>
              {p.cta && (
                <span className="text-[10px] font-semibold text-[#1877F2] whitespace-nowrap">
                  {p.cta}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* dots */}
      <div className="flex justify-center gap-1 mt-2.5">
        {promos.map((_, i) => (
          <span
            key={i}
            className={`h-1 rounded-full transition-all ${
              i === active ? "w-3 bg-[#1877F2]" : "w-1 bg-[#CBD5E1]"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
