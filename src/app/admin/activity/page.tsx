"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  Wallet,
  ShoppingBag,
  Settings2,
  Tag,
  Shield,
} from "lucide-react";

type Kind = "all" | "funding" | "orders" | "admin";

type Event = {
  id: string;
  kind: Exclude<Kind, "all">;
  title: string;
  detail: string;
  time: string;
};

const EVENTS: Event[] = [
  {
    id: "1",
    kind: "orders",
    title: "Order completed",
    detail: "Adaobi Okeke · Virtual Number · WhatsApp NG · ₦650",
    time: "2 min ago",
  },
  {
    id: "2",
    kind: "funding",
    title: "Wallet funded",
    detail: "Adaobi Okeke · Paystack · ₦20,000",
    time: "18 min ago",
  },
  {
    id: "3",
    kind: "admin",
    title: "Price change saved",
    detail: "Virtual Numbers markup set to +30%",
    time: "1 hr ago",
  },
  {
    id: "4",
    kind: "orders",
    title: "Order pending",
    detail: "Tunde Adebayo · SMM IG Followers 1k · ₦2,800",
    time: "2 hr ago",
  },
  {
    id: "5",
    kind: "admin",
    title: "User suspended",
    detail: "Fatima Yusuf · reason: OTP spam",
    time: "Yesterday",
  },
  {
    id: "6",
    kind: "funding",
    title: "Wallet funded",
    detail: "Tunde Adebayo · Bank transfer · ₦50,000",
    time: "Yesterday",
  },
  {
    id: "7",
    kind: "admin",
    title: "Branding updated",
    detail: "Panel name & primary color saved",
    time: "2 days ago",
  },
  {
    id: "8",
    kind: "orders",
    title: "Order failed",
    detail: "Chinedu Bassey · Virtual Number · Telegram",
    time: "2 days ago",
  },
  {
    id: "9",
    kind: "admin",
    title: "Customer signed up",
    detail: "Grace Nwosu · referral E2637BDA",
    time: "3 days ago",
  },
];

const iconFor = (kind: Event["kind"]) => {
  if (kind === "funding") return Wallet;
  if (kind === "orders") return ShoppingBag;
  if (kind === "admin") return Settings2;
  return Shield;
};

export default function AdminActivityPage() {
  const [filter, setFilter] = useState<Kind>("all");

  const list = useMemo(() => {
    if (filter === "all") return EVENTS;
    return EVENTS.filter((e) => e.kind === filter);
  }, [filter]);

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-16">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/admin" className="text-[#64748B]">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Activity</h1>
      </header>

      <div className="px-4 pt-4 max-w-lg mx-auto space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "funding", "orders", "admin"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
                filter === f
                  ? "bg-[#1877F2] text-white border-[#1877F2]"
                  : "bg-white text-[#64748B] border-[#E2E8F0]"
              }`}
            >
              {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16">
            <UserPlus size={28} className="mx-auto text-[#CBD5E1]" />
            <p className="mt-3 text-sm text-[#94A3B8]">No activity yet on this panel.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {list.map((e) => {
              const Icon = iconFor(e.kind);
              return (
                <div
                  key={e.id}
                  className="bg-white border border-[#E2E8F0] rounded-[14px] p-4 flex gap-3"
                >
                  <div className="w-10 h-10 rounded-[12px] bg-[#EFF6FF] flex items-center justify-center text-[#1877F2] shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#0F172A]">{e.title}</p>
                      <span className="text-[10px] text-[#94A3B8] shrink-0">{e.time}</span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{e.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-[#94A3B8] pt-2">
          Panel-only feed for audit and support. Not a second Transactions screen.
        </p>
      </div>
    </div>
  );
}
