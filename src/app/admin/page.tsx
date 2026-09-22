"use client";

import Link from "next/link";
import {
  Users,
  Wallet,
  Settings,
  Tag,
  Activity,
  ArrowLeft,
  Shield,
  Package,
  ChevronRight,
} from "lucide-react";

const cards = [
  {
    title: "Users",
    desc: "View and manage customers",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Wallet & Pricing",
    desc: "Set retail prices & margins",
    icon: Tag,
    href: "/admin/wallet",
  },
  {
    title: "Transactions",
    desc: "Orders and wallet funding",
    icon: Wallet,
    href: "/admin/transactions",
  },
  {
    title: "Activity",
    desc: "Live system activity",
    icon: Activity,
    href: "/admin/activity",
  },
  {
    title: "Products",
    desc: "Shopping catalog & release",
    icon: Package,
    href: "/admin/products",
  },
  {
    title: "Settings",
    desc: "Branding, payments & security",
    icon: Settings,
    href: "/admin/settings",
  },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-10">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/home" className="p-1 -ml-1 text-[#64748B]">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-[#1877F2]" />
            <h1 className="text-base font-semibold text-[#0F172A]">Admin Panel</h1>
          </div>
        </div>
        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
          Open during build
        </span>
      </header>

      <div className="px-4 py-5 max-w-lg mx-auto">
        <div className="mb-5 p-4 rounded-[14px] bg-[#1877F2]/5 border border-[#1877F2]/20">
          <p className="text-sm font-semibold text-[#0F172A]">Child Panel · Build phase</p>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            Password lock is disabled until the backend is connected. Admin will be protected after env variables are set.
            Child Panel pricing is not the same as API pricing.
          </p>
        </div>

        <p className="text-[11px] font-semibold tracking-wide text-[#64748B] uppercase mb-3">Main menu</p>

        <div className="grid gap-2.5">
          {cards.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="flex items-center gap-4 p-4 bg-white border border-[#E2E8F0] rounded-[14px] hover:border-[#1877F2]/40 active:scale-[0.99] transition-all"
            >
              <div className="w-11 h-11 rounded-[12px] bg-[#EFF6FF] flex items-center justify-center text-[#1877F2] shrink-0">
                <c.icon size={20} strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F172A]">{c.title}</p>
                <p className="text-xs text-[#64748B] mt-0.5">{c.desc}</p>
              </div>
              <ChevronRight size={18} className="text-[#CBD5E1] shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
