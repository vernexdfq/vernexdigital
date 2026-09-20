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
} from "lucide-react";

const cards = [
  {
    title: "Users",
    desc: "View and manage customers",
    icon: Users,
    href: "#",
  },
  {
    title: "Wallet & Pricing",
    desc: "Set retail prices & margins",
    icon: Tag,
    href: "#",
  },
  {
    title: "Transactions",
    desc: "Orders and wallet funding",
    icon: Wallet,
    href: "#",
  },
  {
    title: "Activity",
    desc: "Live system activity",
    icon: Activity,
    href: "#",
  },
  {
    title: "Settings",
    desc: "Paystack keys, branding",
    icon: Settings,
    href: "#",
  },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-[#E2E8F0] px-4 h-14 flex items-center justify-between">
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

      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="mb-6 p-4 rounded-[12px] bg-[#1877F2]/5 border border-[#1877F2]/20">
          <p className="text-sm font-medium text-[#0F172A]">Build-phase access</p>
          <p className="text-xs text-[#64748B] mt-1">
            Password lock is disabled until Supabase is connected. Admin will be protected after env variables are set.
          </p>
        </div>

        <div className="grid gap-3">
          {cards.map((c) => (
            <Link
              key={c.title}
              href={c.href}
              className="flex items-center gap-4 p-4 bg-white border border-[#E2E8F0] rounded-[12px] hover:border-[#1877F2]/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-[10px] bg-[#F8FAFC] flex items-center justify-center text-[#1877F2]">
                <c.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">{c.title}</p>
                <p className="text-xs text-[#64748B]">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
