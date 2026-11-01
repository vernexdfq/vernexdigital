"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
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
    line: "Verifying one specific app",
  },
  {
    id: "all",
    name: "All-Platform OTP Rental",
    icon: Globe2,
    accent: "from-[#EFF6FF] to-[#E0E7FF]",
    iconColor: "text-[#4F46E5]",
    line: "Registering several apps with one number",
  },
  {
    id: "line",
    name: "Full Two-Way Mobile Line",
    icon: PhoneCall,
    accent: "from-[#ECFDF5] to-[#D1FAE5]",
    iconColor: "text-[#059669]",
    line: "Actually talking and texting",
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

      <main className="px-4 pt-6 space-y-5">
        {/* Professional CTA */}
        <Link
          href="#rental-options"
          className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0B1F4D] to-[#1877F2] text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(24,119,242,0.28)] transition active:scale-[0.99]"
        >
          Get My Number
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* Clean minimal tiles — icon, name, one line */}
        <div id="rental-options" className="space-y-3 scroll-mt-4">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div
                key={tier.id}
                className="flex items-center gap-3.5 rounded-[16px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_14px_rgba(15,23,42,0.04)]"
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ${tier.accent}`}
                >
                  <Icon size={24} strokeWidth={1.8} className={tier.iconColor} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-bold tracking-tight text-[#0F172A]">{tier.name}</h2>
                  <p className="mt-0.5 text-[12px] leading-snug text-[#64748B]">{tier.line}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#64748B]">
                  Soon
                </span>
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
