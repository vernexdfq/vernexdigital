"use client";

import Link from "next/link";
import { ArrowLeft, Headphones, Send, MessageCircle, Users } from "lucide-react";

const LINKS = {
  telegramSupport: "https://t.me/vernexdigital_support",
  telegramChannel: "https://t.me/VernexDigital",
  whatsappSupport: "https://wa.me/2349164159443",
  whatsappChannel: "https://whatsapp.com/channel/0029VbFHDLYKgsO15Un2I118",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-40">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/profile" className="text-[#0F172A] flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={20} />
          Back
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">Help & Support</h1>
      </header>

      <div className="px-4 pt-5 space-y-3 max-w-lg mx-auto">
        <div className="rounded-[16px] bg-gradient-to-br from-[#0B1F4D] to-[#1877F2] p-5 text-white mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <Headphones size={22} />
            </div>
            <div>
              <p className="font-semibold">We are here to help</p>
              <p className="text-xs text-white/75 mt-0.5">Reach Vernex support anytime</p>
            </div>
          </div>
        </div>

        <SupportCard
          icon={<Send size={18} className="text-[#1877F2]" />}
          title="Telegram Support"
          desc="Chat with us instantly via Telegram."
          cta="Message on Telegram"
          href={LINKS.telegramSupport}
        />
        <SupportCard
          icon={<Users size={18} className="text-[#1877F2]" />}
          title="Join Our Telegram Channel"
          desc="News, promotions and product updates."
          cta="Join Telegram Channel"
          href={LINKS.telegramChannel}
        />
        <SupportCard
          icon={<MessageCircle size={18} className="text-[#25D366]" />}
          title="WhatsApp Support"
          desc="Reach our support team on WhatsApp."
          cta="Message on WhatsApp"
          href={LINKS.whatsappSupport}
        />
        <SupportCard
          icon={<MessageCircle size={18} className="text-[#25D366]" />}
          title="WhatsApp Channel"
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
  desc,
  cta,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-[#E2E8F0] rounded-[14px] p-4 hover:border-[#1877F2]/40 transition"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#0F172A]">{title}</p>
          <p className="text-xs text-[#64748B] mt-0.5">{desc}</p>
          <p className="text-xs font-semibold text-[#1877F2] mt-2">{cta} →</p>
        </div>
      </div>
    </a>
  );
}
