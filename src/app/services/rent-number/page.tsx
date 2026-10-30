"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  Globe2,
  PhoneCall,
  Target,
} from "lucide-react";
import WalletBalance from "@/components/WalletBalance";

const tiers = [
  {
    id: "single",
    name: "Single-Platform Rental",
    icon: Target,
    accent: "from-[#E0F2FE] to-[#DBEAFE]",
    iconColor: "text-[#0284C7]",
    bestFor: "Verifying one specific app",
    desc: "Locked to one app (e.g. WhatsApp only) for the whole rental duration.",
    features: [
      "Locked to the platform you choose",
      "Codes delivered for the full rental period",
      "Pick the rental duration that fits you",
    ],
  },
  {
    id: "all",
    name: "All-Platform OTP Rental",
    icon: Globe2,
    accent: "from-[#EFF6FF] to-[#E0E7FF]",
    iconColor: "text-[#4F46E5]",
    bestFor: "Registering several apps with one number",
    desc: "One number that catches codes from WhatsApp, TikTok, Instagram, Telegram and more — over days or weeks.",
    features: [
      "Codes from every major platform",
      "Register multiple apps on one number",
      "Keep receiving codes for days or weeks",
    ],
  },
  {
    id: "line",
    name: "Full Two-Way Mobile Line",
    icon: PhoneCall,
    accent: "from-[#ECFDF5] to-[#D1FAE5]",
    iconColor: "text-[#059669]",
    bestFor: "Actually talking and texting",
    desc: "A real active line: send and receive SMS with anybody, plus voice calling.",
    features: [
      "Two-way SMS with anyone",
      "Make voice calls from your line",
      "A live number on your account",
    ],
  },
];

export default function RentNumberPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-1.5 text-sm font-medium text-[#0F172A]">
            <ArrowLeft size={18} /> Back
          </Link>
          <h1 className="text-sm font-semibold text-[#0F172A]">Rent Number</h1>
          <WalletBalance />
        </div>
      </header>

      <main className="px-4 pt-4 space-y-4">
        <div className="rounded-[14px] bg-gradient-to-br from-[#0B1220] to-[#152238] p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[12px] bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
            <PhoneCall size={22} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-white leading-tight">Rent a Number</p>
            <p className="text-[12px] text-slate-300 mt-0.5 leading-snug">
              Need just a code? Or a full line to talk and text? Pick what fits.
            </p>
          </div>
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
          Choose how you want to rent
        </p>

        <div className="space-y-3">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className="relative rounded-[16px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
              >
                <span className="absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#64748B]">
                  <Clock size={11} />
                  Coming Soon
                </span>

                <div className="flex items-start gap-3.5 pr-24">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${tier.accent}`}
                  >
                    <Icon size={24} strokeWidth={1.8} className={tier.iconColor} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold tracking-tight text-[#0F172A]">{tier.name}</h2>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#1877F2]">{tier.bestFor}</p>
                  </div>
                </div>

                <p className="mt-3 text-[12px] leading-snug text-[#64748B]">{tier.desc}</p>

                <ul className="mt-3 space-y-1.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-[#334155]">
                      <Check size={14} className="mt-0.5 shrink-0 text-[#1877F2]" strokeWidth={2.6} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled
                  className="mt-4 h-11 w-full rounded-full bg-[#F1F5F9] text-[13px] font-semibold text-[#94A3B8]"
                >
                  Coming Soon
                </button>
              </div>
            );
          })}
        </div>

        <p className="pt-1 text-center text-[11px] text-[#94A3B8] leading-relaxed">
          Each rental option goes live as we launch it — one by one.
        </p>
      </main>
    </div>
  );
}
