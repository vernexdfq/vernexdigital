"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "How do I purchase a virtual number?",
    a: "Open Virtual Number from Quick Actions or Services, choose a country and service, confirm the displayed price in Naira, and pay from your wallet. Your number and OTP status will appear in order history.",
  },
  {
    q: "Why is a virtual-number service unavailable?",
    a: "Availability depends on live supplier stock. Please try another server, service, or country if the option is unavailable.",
  },
  {
    q: "How do I fund my wallet?",
    a: "Go to Fund Wallet to view your permanent virtual account details (via XixaPay). Send Naira to the displayed account; your wallet is credited after the transfer is confirmed.",
  },
  {
    q: "Where can I find my OTP code?",
    a: "Go to Virtual Numbers or the relevant service history, open your active order, and view the OTP when it arrives.",
  },
  {
    q: "What happens if I do not receive an OTP?",
    a: "If an OTP is not received for your order, the amount is refunded to your wallet according to the server refund policy.",
  },
  {
    q: "How do I sell a gift card?",
    a: "Open Gift Card from Services, select the brand, choose Physical or E-Gift, enter face value and code (or upload card images), then submit. Settlement is paid in Naira to your saved bank account after approval.",
  },
  {
    q: "How do I buy data or airtime?",
    a: "Open Data or Airtime from Services, select network and plan, enter the phone number, and confirm payment from your wallet balance.",
  },
  {
    q: "What is Boost Account?",
    a: "Boost Account lets you purchase social media engagement packages. Choose the platform and package, pay from your wallet, and track progress under Boost Orders.",
  },
  {
    q: "How do Buy Logs and Rent Number work?",
    a: "Buy Logs offers pre-verified account logs for supported platforms. Rent Number lets you rent a number for a set period. Both are paid from your wallet and appear in your history.",
  },
  {
    q: "How do I withdraw earnings from gift cards?",
    a: "Add a Nigerian bank account under Gift Card → Withdraw / Add Bank, then request withdrawal. Funds are sent to your saved account after processing.",
  },
];

export default function FaqsPage() {
  const [open, setOpen] = useState(0);

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-28">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-[#E2E8F0] px-4 h-14 flex items-center gap-3">
        <Link href="/profile" className="text-[#0F172A] flex items-center gap-1 text-sm font-medium">
          <ArrowLeft size={20} />
          Profile
        </Link>
        <h1 className="text-base font-semibold text-[#0F172A]">FAQs</h1>
      </header>

      <div className="px-4 pt-4 space-y-4">
        <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-[#0B1F4D] via-[#123A7A] to-[#1877F2] p-5 text-white">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide text-[#93C5FD] mb-2">
            <HelpCircle size={14} />
            HELP CENTER
          </div>
          <h2 className="text-xl font-bold">Frequently asked questions</h2>
          <p className="mt-1 text-sm text-white/75">
            Quick answers about Vernex Digital services and your account.
          </p>
        </div>

        <div className="space-y-2.5">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="bg-white rounded-[14px] border border-[#E2E8F0] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="text-sm font-semibold text-[#0F172A]">{f.q}</span>
                  <span className="text-[#94A3B8] text-lg leading-none">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-[#64748B] py-2">
          Still need help?{" "}
          <Link href="/profile/support" className="text-[#1877F2] font-semibold">
            Contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
