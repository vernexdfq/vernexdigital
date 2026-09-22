"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, Shield, Globe, Zap, CheckCircle2 } from "lucide-react";

const BENEFITS = [
  {
    icon: Globe,
    title: "USD virtual card",
    desc: "Spend and verify online in dollars — Instagram, Google, Apple, and more.",
  },
  {
    icon: Shield,
    title: "Secure by design",
    desc: "Card details stay in your account. Freeze or replace anytime.",
  },
  {
    icon: Zap,
    title: "Instant issue",
    desc: "Get card details in seconds after payment — no plastic, no wait.",
  },
];

export default function VirtualCardPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-28">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/home" className="text-[#0F172A] flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={20} />
          Back
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Virtual Card</h1>
      </header>

      <div className="px-4 pt-5 space-y-5">
        {/* Card visual */}
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0B1F4D] via-[#0F766E] to-[#1877F2] p-6 text-white shadow-lg min-h-[180px]">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_90%_10%,white,transparent_50%)]" />
          <div className="relative flex flex-col justify-between h-full min-h-[132px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={22} />
                <span className="text-sm font-semibold tracking-wide">VERNEX USD</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20">VIRTUAL</span>
            </div>
            <div className="mt-6">
              <p className="text-[11px] text-white/70 tracking-[0.2em]">CARD NUMBER</p>
              <p className="text-lg font-semibold tracking-[0.15em] mt-0.5">•••• •••• •••• ••••</p>
            </div>
            <div className="mt-4 flex justify-between text-xs text-white/80">
              <div>
                <p className="text-[10px] text-white/60">HOLDER</p>
                <p className="font-medium">YOUR NAME</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/60">EXP</p>
                <p className="font-medium">••/••</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#0F172A]">Get your Virtual Dollar Card</h2>
          <p className="mt-1 text-sm text-[#64748B] leading-relaxed">
            Verify social accounts, subscribe to global services, and pay online with a USD card issued straight to your
            Vernex wallet.
          </p>
        </div>

        <div className="space-y-2.5">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="bg-white rounded-[14px] border border-[#E2E8F0] p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{b.title}</p>
                  <p className="mt-0.5 text-xs text-[#64748B] leading-relaxed">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-4">
          <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase mb-2">What you can do</p>
          <ul className="space-y-2">
            {[
              "Verify Instagram, Facebook, TikTok & more",
              "Pay for Google, Apple, Netflix & online tools",
              "Fund in Naira · Spend in USD",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-[#0F172A]">
                <CheckCircle2 size={16} className="text-[#1877F2] shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          disabled
          className="w-full h-12 rounded-full bg-[#1877F2] text-white text-sm font-semibold opacity-60 cursor-not-allowed"
        >
          Coming Soon — Request Card
        </button>
        <p className="text-center text-[11px] text-[#94A3B8] pb-4">
          Virtual cards will open for issuance once payment rails are live.
        </p>
      </div>
    </div>
  );
}
