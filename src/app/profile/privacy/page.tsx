"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, User, Settings, Cookie, Scale, Plug, RefreshCw, Mail } from "lucide-react";

const SECTIONS = [
  {
    id: "01",
    title: "Information We Collect",
    icon: User,
    body: "We may collect personal details such as your full name, email address, phone number, payment information, and usage data when you create an account or use our services (Virtual Numbers, Boost Account, Buy Logs, Rent Number, Data, Airtime, Gift Cards, and more). Additional verification details may be requested for security and compliance purposes.",
  },
  {
    id: "02",
    title: "How We Use Your Information",
    icon: Settings,
    body: "We use your information to provide and improve Vernex Digital services, process wallet funding and withdrawals, deliver virtual numbers and OTP codes, process gift card trades, prevent fraud, and communicate important account updates.",
  },
  {
    id: "03",
    title: "Data Protection",
    icon: Shield,
    body: "Your data is protected with industry-standard encryption in transit (SSL/TLS) and at rest. Access is restricted to authorized personnel. We never sell your personal information to third parties.",
  },
  {
    id: "04",
    title: "Cookies",
    icon: Cookie,
    body: "Our platform uses cookies to remember your preferences and improve performance. You can disable cookies in your browser settings, though some features may not function properly without them.",
  },
  {
    id: "05",
    title: "Your Rights",
    icon: Scale,
    body: "You may request access to, correction of, or deletion of your personal data, subject to legal and operational requirements. Contact support to exercise these rights.",
  },
  {
    id: "06",
    title: "Third-Party Services",
    icon: Plug,
    body: "We work with payment processors (including XixaPay), telecom and number suppliers, and messaging platforms. These providers have their own privacy policies, and we encourage you to review them before use.",
  },
  {
    id: "07",
    title: "Updates to This Policy",
    icon: RefreshCw,
    body: "We may update this Privacy Policy from time to time to reflect service improvements or legal requirements. All updates will be published on this page, and continued use of our services implies acceptance of any changes.",
  },
];

export default function PrivacyPage() {
  const [open, setOpen] = useState<string | null>("01");

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-28">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/profile" className="text-[#0F172A] flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={20} />
          Back
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Privacy Policy</h1>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#0B1F4D] via-[#123A7A] to-[#1877F2] p-5 text-white">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-emerald-300 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            LEGAL DOCUMENT
          </div>
          <h2 className="text-2xl font-bold">
            Privacy <span className="text-[#93C5FD]">Policy</span>
          </h2>
          <p className="mt-2 text-sm text-white/80 leading-relaxed">
            Your trust is our foundation. Here&apos;s exactly how we collect, use, and protect your personal data.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-white/70">
            <span>Last updated: January 2025</span>
            <span>3 min read</span>
            <span className="flex items-center gap-1">
              <Shield size={12} /> SSL Encrypted
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[14px] border border-[#E2E8F0] p-4 flex gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
            <Shield size={18} className="text-[#1877F2]" />
          </div>
          <p className="text-sm text-[#334155] leading-relaxed">
            At <strong>Vernex Digital</strong>, your privacy and trust are our top priorities. This policy describes how
            we collect, use, and protect your personal data when you use Virtual Numbers, Boost Account, Buy Logs, Rent
            Number, Data, Airtime, Gift Cards, and related services.
          </p>
        </div>

        <div className="space-y-2.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const isOpen = open === s.id;
            return (
              <div key={s.id} className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[#1877F2]" />
                  </div>
                  <span className="flex-1 text-sm font-semibold text-[#0F172A]">{s.title}</span>
                  <span className="text-xs font-bold text-[#1877F2] tabular-nums">{s.id}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] pt-3">
                    {s.body}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center mx-auto mb-3">
            <Mail size={22} />
          </div>
          <p className="text-base font-semibold text-[#0F172A]">Have Questions?</p>
          <p className="mt-1 text-sm text-[#64748B]">
            If you have concerns about our Privacy Policy or how your data is handled, our support team is here to help.
          </p>
          <a
            href="mailto:support@vernexdigital.com"
            className="mt-4 inline-flex h-11 px-5 rounded-full bg-[#1877F2] text-white text-sm font-semibold items-center gap-2"
          >
            <Mail size={16} />
            support@vernexdigital.com
          </a>
        </div>
      </div>
    </div>
  );
}
