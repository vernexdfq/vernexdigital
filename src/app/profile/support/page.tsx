"use client";

import Link from "next/link";
import { ArrowLeft, Headphones, Send, MessageCircle, Users } from "lucide-react";

const LINKS = {
  telegramSupport: "https://t.me/vernexdigital",
  telegramChannel: "https://t.me/vernexdigital_channel",
  whatsappSupport: "https://wa.me/2348000000000",
  whatsappChannel: "https://whatsapp.com/channel/vernex",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-28">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/profile" className="text-[#0F172A] flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={20} />
          Back
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Support Center</h1>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#0B1F4D] via-[#123A7A] to-[#1877F2] p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
              <Headphones size={24} />
            </div>
            <div>
              <p className="text-lg font-semibold">Support Center</p>
              <p className="text-sm text-white/75">Hi! How can we help you today?</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] font-semibold tracking-[0.14em] text-[#64748B] uppercase">Direct Support</p>

        <SupportCard
          icon={<Send size={20} className="text-[#1877F2]" />}
          title="Telegram Support"
          badge="1–4 hrs"
          desc="Chat with us instantly via Telegram."
          cta="Message on Telegram"
          href={LINKS.telegramSupport}
        />
        <SupportCard
          icon={<Users size={20} className="text-[#1877F2]" />}
          title="Join Our Telegram Channel"
          badge="Community"
          desc="Get announcements, tips, and updates from our team."
          cta="Join Telegram Channel"
          href={LINKS.telegramChannel}
        />
        <SupportCard
          icon={<MessageCircle size={20} className="text-[#25D366]" />}
          title="WhatsApp Support"
          badge="1–4 hrs"
          desc="Reach our support team on WhatsApp."
          cta="Message on WhatsApp"
          href={LINKS.whatsappSupport}
        />
        <SupportCard
          icon={<Users size={20} className="text-[#25D366]" />}
          title="WhatsApp Channel"
          badge="Community"
          desc="Follow our WhatsApp channel for news and offers."
          cta="Join WhatsApp Channel"
          href={LINKS.whatsappChannel}
        />
      </div>
    </div>
  );
}

function SupportCard({
  icon,
  title,
  badge,
  desc,
  cta,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  badge: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              {badge}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#64748B]">{desc}</p>
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 w-full h-11 rounded-full bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2"
      >
        {cta}
      </a>
    </div>
  );
}
