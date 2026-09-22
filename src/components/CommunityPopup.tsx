"use client";

import { useEffect, useState } from "react";
import { Megaphone, MessageCircle, Send, X } from "lucide-react";

/** Replace with real Vernex links when you send them */
const TELEGRAM_URL = "https://t.me/VernexOfficial";
const WHATSAPP_URL = "https://wa.me/2348000000000";

const STORAGE_KEY = "vernex-community-prompt-day";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function markShown() {
  try {
    window.localStorage.setItem(STORAGE_KEY, todayKey());
  } catch {
    /* ignore */
  }
}

function shouldShow() {
  try {
    const last = window.localStorage.getItem(STORAGE_KEY);
    if (!last) return true;
    return last !== todayKey();
  } catch {
    return true;
  }
}

export default function CommunityPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldShow()) return;
    const timer = window.setTimeout(() => {
      markShown();
      setOpen(true);
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    markShown();
    setOpen(false);
  };

  const openChannel = (url: string) => {
    markShown();
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vernex-community-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-[340px] rounded-[20px] bg-white shadow-xl px-5 pt-6 pb-5">
        <button
          type="button"
          onClick={close}
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div className="mx-auto w-14 h-14 rounded-full bg-[#EFF6FF] text-[#1877F2] flex items-center justify-center">
          <Megaphone size={24} strokeWidth={2.1} />
        </div>

        <p className="mt-4 text-center text-[11px] font-semibold tracking-[0.14em] uppercase text-[#1877F2]">
          Vernex Community
        </p>
        <h2
          id="vernex-community-title"
          className="mt-1.5 text-center text-xl font-bold text-[#0F172A]"
        >
          Stay in the Loop
        </h2>
        <p className="mt-2 text-center text-sm text-[#64748B] leading-relaxed">
          Join Vernex on Telegram or WhatsApp for promotions, announcements, and
          exclusive offers.
        </p>

        <button
          type="button"
          onClick={() => openChannel(TELEGRAM_URL)}
          className="mt-5 w-full h-12 rounded-[12px] bg-[#1877F2] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#166FE5] transition"
        >
          <Send size={17} />
          Join Telegram
        </button>
        <button
          type="button"
          onClick={() => openChannel(WHATSAPP_URL)}
          className="mt-2.5 w-full h-12 rounded-[12px] bg-[#25D366] text-white text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#20BD5A] transition"
        >
          <MessageCircle size={18} />
          Join WhatsApp
        </button>
        <button
          type="button"
          onClick={close}
          className="mt-3 w-full h-10 text-sm font-medium text-[#64748B]"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
