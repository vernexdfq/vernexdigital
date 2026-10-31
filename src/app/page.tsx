"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Smartphone,
  ShoppingBag,
  Plane,
  Gamepad2,
  Rocket,
  Tv,
  Zap,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lock,
  Globe2,
  RefreshCw,
  Star,
  Sparkles,
  Clock,
  PackageCheck,
  Coins,
  Layers,
  Check,
} from "lucide-react";
import VernexLogo from "@/components/VernexLogo";

type ServiceKey =
  | "numbers"
  | "shopping"
  | "flights"
  | "gaming"
  | "boost"
  | "bills"
  | "data"
  | "cards";

interface ServiceData {
  id: ServiceKey;
  pillLabel: string;
  pillIcon: React.ElementType;
  badge: string;
  headline: string;
  subhead: string;
  image: string;
  altImage?: string;
  imageAlt: string;
  ctaText: string;
  ctaHref: string;
  secondaryText: string;
  features: { title: string; desc: string }[];
  tag: string;
}

const servicesData: Record<ServiceKey, ServiceData> = {
  numbers: {
    id: "numbers",
    pillLabel: "Virtual Numbers",
    pillIcon: Smartphone,
    badge: "Carrier-Grade Non-VoIP",
    headline: "Carrier-Grade Virtual Numbers for Instant OTP & Dedicated Rentals",
    subhead:
      "Access real, high-delivery mobile numbers originating from tier-1 US and global mobile operators. Instantly receive verification codes for 2,000+ platforms or rent dedicated lines to keep accounts safe.",
    image: "/3d/vernex_virtual_number_sms_3d.png",
    imageAlt: "Vernex 3D Virtual Numbers & SMS Showcase",
    ctaText: "Get Virtual Number",
    ctaHref: "/services/virtual-number",
    secondaryText: "Explore Rentals",
    tag: "100% No-Code Refund Policy",
    features: [
      {
        title: "Instant One-Time OTP",
        desc: "Disposable 10–20 minute numbers for WhatsApp, Google, Telegram, and TikTok with automated 100% refund if no code arrives.",
      },
      {
        title: "Single-Platform Long-Term Rental",
        desc: "Retain the same phone number for weeks or months dedicated to a single app (e.g. WhatsApp Business or Telegram).",
      },
      {
        title: "All-Platform Multi-Service Line",
        desc: "One dedicated non-VoIP number to register and catch codes from all major platforms over days or weeks.",
      },
      {
        title: "Two-Way Voice & SMS Available",
        desc: "Active lines with in-app 2-way text messaging and voice verification code transcription.",
      },
    ],
  },
  shopping: {
    id: "shopping",
    pillLabel: "Phones & Gadgets",
    pillIcon: ShoppingBag,
    badge: "Verified Hardware & Tech",
    headline: "Flagship Gadgets, Smartphones & Tech Essentials",
    subhead:
      "Browse guaranteed authentic smartphones, laptops, smartwatches, and premium audio gear. Check out directly with your Vernex wallet balance with tracked door-to-door delivery.",
    image: "/3d/vernex_phones_showcase_3d.png",
    altImage: "/3d/vernex_gadget_shopping_3d.png",
    imageAlt: "Vernex 3D Gadget & Smartphones Showcase",
    ctaText: "Shop Gadgets",
    ctaHref: "/services/shopping",
    secondaryText: "View Catalog",
    tag: "Genuine Device Warranty",
    features: [
      {
        title: "Brand-New & Tested Flagships",
        desc: "iPhones, Samsung Galaxy, MacBooks, gaming laptops, smartwatches, and premium wireless audio gear.",
      },
      {
        title: "Direct Wallet Checkout",
        desc: "No bank card limits or failed POS transfers. Pay instantly with your funded Vernex balance.",
      },
      {
        title: "Escrowed Order Fulfillment",
        desc: "Every shipment is verified and insured from warehouse packaging to nationwide doorstep handover.",
      },
      {
        title: "Transparent Order Tracking",
        desc: "Real-time fulfillment stages from your Vernex profile with direct WhatsApp support updates.",
      },
    ],
  },
  flights: {
    id: "flights",
    pillLabel: "Flight Booking",
    pillIcon: Plane,
    badge: "Worldwide Airlines",
    headline: "Instant Domestic & International Flight Reservations",
    subhead:
      "Search, compare, and book flights across major local and international carriers. Pay for airline tickets directly in Naira from your Vernex balance with instant digital e-ticket generation.",
    image: "/3d/vernex_flight_booking_3d.png",
    imageAlt: "Vernex 3D Flight Booking Showcase",
    ctaText: "Search Flights",
    ctaHref: "/services/flights",
    secondaryText: "Flight Schedule",
    tag: "Instant PNR & E-Ticket",
    features: [
      {
        title: "Domestic & Global Carriers",
        desc: "Book Air Peace, Ibom Air, Qatar Airways, British Airways, Emirates, Turkish Airlines, and Ethiopian Airlines.",
      },
      {
        title: "Zero FX Limits or Surcharges",
        desc: "Never worry about international card monthly limits. Pay for international flights seamlessly in Naira.",
      },
      {
        title: "Instant Digital E-Ticket",
        desc: "Receive your airline confirmation, booking reference (PNR), and flight itinerary directly in-app.",
      },
      {
        title: "24/7 Travel Assistance",
        desc: "Dedicated support for date changes, baggage additions, and flight status notifications.",
      },
    ],
  },
  gaming: {
    id: "gaming",
    pillLabel: "Gaming Top-Up",
    pillIcon: Gamepad2,
    badge: "Instant Digital Vouchers",
    headline: "Fast Gaming Top-Up & Digital Game Credits",
    subhead:
      "Recharge game credits, battle passes, and virtual currencies instantly. Compatible with Steam, PlayStation Network, Xbox Live, Free Fire, PUBG Mobile, Roblox, and EA Play.",
    image: "/3d/vernex_gaming_topup_3d.png",
    imageAlt: "Vernex 3D Gaming Top-Up Showcase",
    ctaText: "Top Up Game Credits",
    ctaHref: "/services/gaming",
    secondaryText: "View Supported Games",
    tag: "Zero Card Decline Errors",
    features: [
      {
        title: "Top Global Game Titles",
        desc: "Instant keys and credit top-ups for Steam Wallet, PSN, Xbox, Free Fire Diamonds, PUBG UC, and Roblox.",
      },
      {
        title: "Automated Code Generation",
        desc: "Your voucher redemption code is displayed immediately upon wallet debit with full copy-to-clipboard ease.",
      },
      {
        title: "Local Currency Simplicity",
        desc: "No need for dollar cards or overseas PayPal accounts. Pay directly with your Vernex Naira wallet.",
      },
      {
        title: "100% Guaranteed Validity",
        desc: "Authorized digital distributor codes delivered straight from publisher verification pipelines.",
      },
    ],
  },
  boost: {
    id: "boost",
    pillLabel: "Social Boost",
    pillIcon: Rocket,
    badge: "Creator & Agency Growth",
    headline: "Accelerated Social Media Growth & Audience Reach",
    subhead:
      "Boost visibility, followers, likes, and views across Instagram, TikTok, YouTube, X, and Facebook. Engineered for creators, businesses, and digital agencies building social presence.",
    image: "/3d/vernex_social_boost_3d.png",
    imageAlt: "Vernex 3D Social Boost Showcase",
    ctaText: "Launch Growth Campaign",
    ctaHref: "/services/boost",
    secondaryText: "Pricing Calculator",
    tag: "High-Retention Delivery",
    features: [
      {
        title: "All Major Platforms",
        desc: "Targeted campaigns for Instagram, TikTok, YouTube Subscribers & Watch Time, X (Twitter), and Facebook.",
      },
      {
        title: "Customizable Campaign Speed",
        desc: "Select organic drip-feed or high-velocity delivery options depending on your profile goals.",
      },
      {
        title: "Automated Order Tracking",
        desc: "Live campaign progress monitors showing starting counts, delivered quantity, and completion timestamps.",
      },
      {
        title: "Transparent Tiered Pricing",
        desc: "Clear per-thousand rates with zero hidden recurring charges or subscription locks.",
      },
    ],
  },
  bills: {
    id: "bills",
    pillLabel: "Cable & Electricity",
    pillIcon: Tv,
    badge: "24/7 Automated Utility Bills",
    headline: "Instant Prepaid Electricity Tokens & Cable TV Unfreezing",
    subhead:
      "Pay electricity bills across all Nigerian Discos and renew DStv, GOtv, or StarTimes subscriptions with zero downtime. 20-digit meter tokens display instantly on your screen and via receipt.",
    image: "/3d/vernex_bills_utilities_3d.png",
    imageAlt: "Vernex 3D Bills & Utilities Showcase",
    ctaText: "Pay Utility Bill",
    ctaHref: "/services/electricity",
    secondaryText: "Cable TV Packages",
    tag: "Instant 20-Digit Token Display",
    features: [
      {
        title: "All Nigerian Discos Covered",
        desc: "Instant token generation for IKEDC, EKEDC, AEDC, IBEDC, PHED, EEDC, KEDCO, and BEDC meters.",
      },
      {
        title: "Prepaid & Postpaid Support",
        desc: "Automatic verification of meter customer names before wallet debit to prevent wrong recharge errors.",
      },
      {
        title: "Zero-Downtime Cable TV",
        desc: "Instant package renewal and signal reconnection for DStv, GOtv, and StarTimes decoders.",
      },
      {
        title: "Saved Smartcard & Meters",
        desc: "Save frequent meter and decoder numbers for lightning-fast monthly one-click recharges.",
      },
    ],
  },
  data: {
    id: "data",
    pillLabel: "Data & Airtime",
    pillIcon: Zap,
    badge: "Direct Telco Switch",
    headline: "Fast Automated VTU Mobile Data & Airtime",
    subhead:
      "Instant data top-ups and airtime recharges across MTN, Airtel, Glo, and 9mobile. Benefit from low retail and SME data prices with instant automated 24/7 delivery.",
    image: "/3d/vernex_virtual_number_sms_3d.png",
    imageAlt: "Vernex Data & Airtime VTU",
    ctaText: "Recharge Data & Airtime",
    ctaHref: "/services/data",
    secondaryText: "Check Data Plans",
    tag: "Instant Network Delivery",
    features: [
      {
        title: "All 4 Telecom Networks",
        desc: "Stable pipelines for MTN SME & Corporate, Airtel Gifting, Glo Data, and 9mobile.",
      },
      {
        title: "3-Line Fast Mobile Layout",
        desc: "OPay-grade mobile plan cards with large data caps, validity duration, and one-tap payment buttons.",
      },
      {
        title: "Specialized Long-Term Bundles",
        desc: "Daily, weekly, monthly, 3-months+, and router plans available directly from the catalog.",
      },
      {
        title: "24/7 Automated Processing",
        desc: "Instant delivery even during late night hours with automatic receipt and wallet transaction logs.",
      },
    ],
  },
  cards: {
    id: "cards",
    pillLabel: "USD Virtual Cards",
    pillIcon: CreditCard,
    badge: "International Payments",
    headline: "Reliable USD Virtual Cards for Global Subscriptions",
    subhead:
      "Create high-acceptance virtual USD Visa and Mastercards to pay for international tools, subscriptions, ads, and digital shopping without foreign exchange card limits.",
    image: "/3d/vernex_phones_showcase_3d.png",
    imageAlt: "Vernex Virtual Cards Showcase",
    ctaText: "Get Virtual Card",
    ctaHref: "/services/virtual-card",
    secondaryText: "Card Limits & Rates",
    tag: "Global Merchant Acceptance",
    features: [
      {
        title: "Accepted Worldwide",
        desc: "Pay for Netflix, Spotify, Apple Music, Google Workspace, Amazon, Canva, and Facebook Ads.",
      },
      {
        title: "Fund with Naira Wallet",
        desc: "Convert your Vernex wallet funds directly into USD card balance at competitive live rates.",
      },
      {
        title: "Instant In-App Card Controls",
        desc: "Freeze, unfreeze, check card statements, and view CVV security codes with one tap.",
      },
      {
        title: "3D Secure OTP Protection",
        desc: "Receive dynamic verification codes directly in your Vernex notifications for secure checkout.",
      },
    ],
  },
};

const serviceGridCards = [
  {
    title: "Virtual Numbers & SMS",
    desc: "US non-VoIP carrier lines for instant OTP and long-term multi-platform rentals.",
    icon: Smartphone,
    href: "/services/virtual-number",
    badge: "Most Popular",
    color: "#1877F2",
  },
  {
    title: "Gadget & Phone Shopping",
    desc: "Guaranteed authentic flagship phones, laptops, and audio gear with tracked shipping.",
    icon: ShoppingBag,
    href: "/services/shopping",
    badge: "Direct Delivery",
    color: "#0B1F4D",
  },
  {
    title: "Flight Booking",
    desc: "Domestic and international airline tickets booked in Naira with instant e-tickets.",
    icon: Plane,
    href: "/services/flights",
    badge: "Worldwide Airlines",
    color: "#0284C7",
  },
  {
    title: "Gaming Top-Up",
    desc: "Steam, PlayStation, Xbox, Free Fire, PUBG, and Roblox credits delivered in seconds.",
    icon: Gamepad2,
    href: "/services/gaming",
    badge: "Zero Delays",
    color: "#7C3AED",
  },
  {
    title: "Social Boost",
    desc: "Accelerate your visibility, followers, likes, and views across major platforms.",
    icon: Rocket,
    href: "/services/boost",
    badge: "Creator Growth",
    color: "#E11D48",
  },
  {
    title: "Cable TV & Electricity",
    desc: "Instant 20-digit prepaid meter tokens and zero-downtime DStv/GOtv renewals.",
    icon: Tv,
    href: "/services/electricity",
    badge: "Automated Bills",
    color: "#0D9488",
  },
  {
    title: "Data & Airtime VTU",
    desc: "Low-cost SME & corporate data bundles for MTN, Airtel, Glo, and 9mobile.",
    icon: Zap,
    href: "/services/data",
    badge: "Instant Delivery",
    color: "#D97706",
  },
  {
    title: "USD Virtual Cards",
    desc: "Fund with Naira and pay for global subscriptions, ads, and digital services.",
    icon: CreditCard,
    href: "/services/virtual-card",
    badge: "Global Visa / MC",
    color: "#2563EB",
  },
];

const faqs = [
  {
    q: "How does the No Code, No Charge guarantee work for virtual numbers?",
    a: "If you purchase an instant verification number and no SMS verification code arrives within the allotted countdown window (usually 10 to 20 minutes), your Vernex wallet is automatically refunded 100% of the cost. There is zero risk.",
    category: "numbers",
  },
  {
    q: "Where do your virtual numbers originate from?",
    a: "Our numbers originate directly from major tier-1 telecommunication carriers (primarily US physical non-VoIP SIMs). They are compatible with sensitive platforms including WhatsApp, Google, Telegram, TikTok, Instagram, and over 2,000 other online services.",
    category: "numbers",
  },
  {
    q: "What is the difference between an Instant OTP and a Long-Term Rental?",
    a: "An Instant OTP number is a disposable line meant for receiving a single verification code within 10–20 minutes. A Dedicated Long-Term Rental lets you keep the exact same number for days, weeks, or months—ideal if you need ongoing access to WhatsApp Business or multi-factor logins.",
    category: "numbers",
  },
  {
    q: "How does gadget shopping and smartphone delivery work?",
    a: "When you browse the Vernex Gadgets catalog, you can purchase verified mobile phones, laptops, and tech accessories directly using your Vernex wallet balance. Orders are dispatched from authorized distributors with nationwide door-to-door courier tracking.",
    category: "shopping",
  },
  {
    q: "Can I pay for international flight bookings directly in Naira?",
    a: "Yes. Vernex eliminates foreign currency limits on bank cards. You search for your preferred flight, choose your fare class, and pay directly using your funded Vernex Naira balance. Your airline PNR and confirmation e-ticket are generated immediately.",
    category: "flights",
  },
  {
    q: "How quickly do gaming top-up vouchers and credits arrive?",
    a: "Gaming vouchers are generated automatically upon wallet checkout. You will immediately see your redemption code and PIN displayed on your confirmation screen, and a copy is permanently logged in your Vernex transaction history.",
    category: "gaming",
  },
  {
    q: "How fast do prepaid electricity meter tokens and cable TV subscriptions activate?",
    a: "Electricity tokens are generated within seconds. Your 20-digit recharge token is displayed immediately on your screen and saved to your transaction history. For cable TV (DStv, GOtv, StarTimes), decoders are reconnected and unfrozen automatically within moments.",
    category: "bills",
  },
  {
    q: "How do I fund my Vernex wallet?",
    a: "Funding your Vernex wallet is fast and fully automated. Once registered, a dedicated virtual bank account number is generated for you. Simply make a standard bank transfer from your mobile banking app or USSD, and your Vernex wallet balance updates instantly.",
    category: "wallet",
  },
];

export default function VernexLandingPage() {
  const [activeService, setActiveService] = useState<ServiceKey>("numbers");
  const [showAltImage, setShowAltImage] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [faqFilter, setFaqFilter] = useState<string>("all");

  const current = servicesData[activeService];

  const filteredFaqs =
    faqFilter === "all"
      ? faqs
      : faqs.filter(
          (f) =>
            f.category === faqFilter ||
            (faqFilter === "numbers" && f.category === "numbers") ||
            (faqFilter === "shopping" && (f.category === "shopping" || f.category === "flights")) ||
            (faqFilter === "utilities" && (f.category === "bills" || f.category === "gaming" || f.category === "wallet"))
        );

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#0F172A] selection:bg-[#1877F2]/15 selection:text-[#1877F2]">
      {/* Top Notification Bar */}
      <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] py-2 text-center text-[12px] font-medium text-[#475569]">
        <span className="inline-flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16A34A] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#16A34A]" />
          </span>
          <strong className="font-semibold text-[#0B1F4D]">Live &amp; Operational:</strong> Fast automated SMS verification, telecom pipelines &amp; utility services.
        </span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-[#E8EEF7] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Vernex home">
            <VernexLogo size={42} />
            <div className="flex flex-col">
              <span className="text-[20px] font-extrabold tracking-[-0.03em] text-[#0B1F4D]">
                Vernex
              </span>
              <span className="text-[10px] font-semibold tracking-[0.06em] text-[#1877F2] uppercase -mt-1">
                Digital Services
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#services-hub"
              className="text-[13px] font-semibold text-[#475569] transition hover:text-[#1877F2]"
            >
              Services Hub
            </a>
            <a
              href="#all-services"
              className="text-[13px] font-semibold text-[#475569] transition hover:text-[#1877F2]"
            >
              Catalog
            </a>
            <a
              href="#how-it-works"
              className="text-[13px] font-semibold text-[#475569] transition hover:text-[#1877F2]"
            >
              How It Works
            </a>
            <a
              href="#trust"
              className="text-[13px] font-semibold text-[#475569] transition hover:text-[#1877F2]"
            >
              Why Vernex
            </a>
            <a
              href="#faq"
              className="text-[13px] font-semibold text-[#475569] transition hover:text-[#1877F2]"
            >
              FAQs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden px-4 py-2 text-[13px] font-bold text-[#334155] transition hover:text-[#0B1F4D] sm:block"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[12px] bg-[#1877F2] px-5 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.24)] transition hover:bg-[#166FE5] hover:shadow-[0_12px_28px_rgba(24,119,242,0.32)] active:scale-[0.98]"
            >
              Get Started
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-[#E8EEF7] bg-[linear-gradient(180deg,#F0F6FF_0%,#FFFFFF_60%)] pt-12 pb-16 sm:pt-16 sm:pb-20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(24,119,242,0.12),transparent_65%)] pointer-events-none" />

          <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8 text-center">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#BFD7FA] bg-white px-4 py-1.5 text-[12px] font-bold text-[#0B1F4D] shadow-[0_3px_12px_rgba(24,119,242,0.08)]">
              <ShieldCheck size={14} className="text-[#1877F2]" strokeWidth={2.5} />
              <span>Official Vernex Digital Platform</span>
              <span className="hidden sm:inline text-[#94A3B8]">|</span>
              <span className="hidden sm:inline font-semibold text-[#1877F2]">
                Instant Verification &amp; Utilities
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-5 text-[34px] sm:text-[48px] lg:text-[54px] font-black leading-[1.12] tracking-[-0.04em] text-[#0B1F4D]">
              Secure SMS <span className="text-[#1877F2]">Verification</span>
              <br className="hidden sm:block" />
              {" & "}
              <span className="text-[#1877F2]">Digital Services</span>
            </h1>

            {/* Approved Sub-headline Option 1 */}
            <p className="mx-auto mt-4 max-w-2xl text-[15px] sm:text-[17px] leading-relaxed text-[#64748B] font-medium">
              Get instant virtual numbers, data, gadgets, and essential digital services through one smooth Vernex wallet. Fast delivery, reliable access, and built for everyday convenience.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#1877F2] px-8 text-[14px] font-bold text-white shadow-[0_12px_28px_rgba(24,119,242,0.30)] transition hover:bg-[#166FE5] active:scale-[0.98]"
              >
                Create Account Free
                <ArrowRight size={16} />
              </Link>
              <a
                href="#services-hub"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-[#D9E2EF] bg-white px-7 text-[14px] font-bold text-[#334155] shadow-sm transition hover:border-[#1877F2] hover:text-[#1877F2] active:scale-[0.98]"
              >
                Browse Interactive Services
                <ChevronDown size={16} />
              </a>
            </div>

            {/* Trust Badges: Clean 2x2 grid on mobile, horizontal pill row on sm+ */}
            <div className="mt-8 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-2.5 text-[11px] sm:text-[12px] font-semibold text-[#334155] max-w-sm sm:max-w-none mx-auto">
              {[
                { label: "Instant SMS Delivery", icon: Zap },
                { label: "200+ Global Regions", icon: Globe2 },
                { label: "Bank-Grade Encryption", icon: Lock },
                { label: "No Code, No Charge", icon: RefreshCw },
              ].map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-3 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.03)] text-center"
                >
                  <Icon size={13} className="text-[#1877F2] shrink-0" strokeWidth={2.4} />
                  <span className="truncate">{label}</span>
                </span>
              ))}
            </div>

            {/* INTERACTIVE SERVICE PILLS STRIP */}
            <div
              id="services-hub"
              className="mt-14 scroll-mt-24 pt-4 border-t border-[#E8EEF7]"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1877F2]">
                Explore Services With Live 3D Previews
              </p>
              <h2 className="mt-1 text-[22px] sm:text-[28px] font-extrabold text-[#0B1F4D] tracking-[-0.03em]">
                Tap Any Service Below
              </h2>

              {/* Structured 2-column grid on mobile, 4-column grid on sm+ (no scattered uneven lines) */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 max-w-2xl mx-auto">
                {(Object.keys(servicesData) as ServiceKey[]).map((key) => {
                  const s = servicesData[key];
                  const Icon = s.pillIcon;
                  const isActive = activeService === key;

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveService(key);
                        setShowAltImage(false);
                      }}
                      className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-full px-2.5 sm:px-3.5 py-2.5 text-[11.5px] sm:text-[13px] font-bold transition-all duration-200 cursor-pointer text-center leading-tight min-h-[44px] ${
                        isActive
                          ? "bg-[#1877F2] text-white shadow-[0_6px_18px_rgba(24,119,242,0.30)] scale-[1.01]"
                          : "border border-[#DCE6F2] bg-white text-[#475569] hover:border-[#1877F2]/60 hover:text-[#0B1F4D] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <Icon size={14} className={`shrink-0 ${isActive ? "text-white" : "text-[#1877F2]"}`} />
                      <span className="truncate">{s.pillLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* INTERACTIVE 3D SHOWCASE CARD */}
            <div className="mt-8 rounded-[24px] border border-[#CDE0F9] bg-gradient-to-b from-white to-[#F8FAFC] p-6 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.08)] text-left">
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                {/* Left: Deep Info & Features */}
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#BFD7FA] bg-[#EFF6FF] px-3 py-1 text-[11px] font-bold text-[#1877F2]">
                    <Sparkles size={13} />
                    {current.badge}
                  </div>

                  <h3 className="mt-3 text-[24px] sm:text-[32px] font-black tracking-[-0.035em] text-[#0B1F4D] leading-tight">
                    {current.headline}
                  </h3>

                  <p className="mt-3 text-[14px] sm:text-[15px] leading-relaxed text-[#64748B]">
                    {current.subhead}
                  </p>

                  {/* Bullet features */}
                  <div className="mt-6 space-y-3">
                    {current.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-[12px] border border-[#E2E8F0] bg-white p-3 shadow-xs"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1877F2]">
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-[#0B1F4D]">{feat.title}</p>
                          <p className="text-[12px] text-[#64748B] leading-5">{feat.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <Link
                      href={current.ctaHref}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#1877F2] px-6 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(24,119,242,0.25)] transition hover:bg-[#166FE5] active:scale-[0.98]"
                    >
                      {current.ctaText}
                      <ArrowRight size={15} />
                    </Link>

                    {current.altImage && (
                      <button
                        onClick={() => setShowAltImage(!showAltImage)}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-[12px] border border-[#CBD5E1] bg-white px-4 text-[12px] font-bold text-[#334155] transition hover:border-[#1877F2] hover:text-[#1877F2]"
                      >
                        <RefreshCw size={13} />
                        {showAltImage ? "Show Phones View" : "Show Full Tech Gadgets"}
                      </button>
                    )}

                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7] px-2.5 py-1 rounded-md">
                      <CheckCircle2 size={12} />
                      {current.tag}
                    </span>
                  </div>
                </div>

                {/* Right: 3D Render Display */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative flex w-full max-w-[420px] items-center justify-center rounded-[20px] border border-[#DCE8F7] bg-gradient-to-b from-[#EFF6FF]/60 to-white p-4 shadow-[0_12px_36px_rgba(24,119,242,0.12)]">
                    <Image
                      src={showAltImage && current.altImage ? current.altImage : current.image}
                      alt={current.imageAlt}
                      width={600}
                      height={600}
                      className="h-auto w-full object-contain drop-shadow-[0_20px_35px_rgba(11,31,77,0.22)] transition-all duration-300"
                      priority
                    />
                  </div>
                  <p className="mt-3 text-center text-[11px] font-semibold text-[#94A3B8]">
                    Authentic 3D Studio Showcase · Connected to live Vernex pipelines
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ALL CAPABILITIES CATALOG GRID */}
        <section id="all-services" className="border-b border-[#E8EEF7] bg-[#F8FAFC] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1877F2]">
                Complete Services Catalog
              </p>
              <h2 className="mt-2 text-[28px] sm:text-[36px] font-extrabold tracking-[-0.035em] text-[#0B1F4D]">
                Built for Consumers, Creators &amp; Everyday Users
              </h2>
              <p className="mt-3 text-[14px] sm:text-[15px] text-[#64748B] leading-relaxed">
                Explore every capability integrated into your Vernex wallet. Launch or purchase with a single tap.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {serviceGridCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="group flex flex-col justify-between rounded-[20px] border border-[#E1E8F2] bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#BFD7FA] hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-[14px] text-white shadow-sm"
                          style={{ backgroundColor: card.color }}
                        >
                          <Icon size={22} />
                        </div>
                        <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-bold text-[#1877F2]">
                          {card.badge}
                        </span>
                      </div>

                      <h3 className="mt-5 text-[16px] font-bold text-[#0B1F4D]">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-[12px] text-[#64748B] leading-relaxed">
                        {card.desc}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-1.5 text-[12px] font-bold text-[#1877F2] transition group-hover:gap-2.5">
                      <span>Launch Service</span>
                      <ArrowRight size={14} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* WHY CHOOSE VERNEX / TRUST PILLARS */}
        <section id="trust" className="border-b border-[#E8EEF7] bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1877F2]">
                  Trust &amp; Reliability
                </p>
                <h2 className="mt-2 text-[30px] sm:text-[38px] font-black tracking-[-0.035em] text-[#0B1F4D] leading-tight">
                  Why Nigerians Trust Vernex for Digital Services
                </h2>
                <p className="mt-4 text-[14px] sm:text-[15px] leading-relaxed text-[#64748B]">
                  Built with strict safeguards, instant automated refunds, and direct telecom switches so your money and services are always secure.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    "One centralized Naira wallet for telecom, flights, shopping & bills",
                    "Automated bank transfer top-up reflected in under 5 seconds",
                    "No Code, No Charge guarantee on every SMS activation",
                    "Dedicated customer support team reachable via in-app tickets & WhatsApp",
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[#16A34A]">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="text-[13px] font-semibold text-[#334155]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Pillar Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[20px] border border-[#E1E8F2] bg-[#F8FAFC] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#1877F2]">
                    <ShieldCheck size={22} />
                  </div>
                  <h3 className="mt-4 text-[16px] font-bold text-[#0B1F4D]">
                    100% Automated Refund
                  </h3>
                  <p className="mt-2 text-[12px] text-[#64748B] leading-relaxed">
                    If an OTP code doesn’t arrive before the countdown expires, your wallet is immediately credited back without filing complaints.
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#E1E8F2] bg-[#F8FAFC] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#1877F2]">
                    <Coins size={22} />
                  </div>
                  <h3 className="mt-4 text-[16px] font-bold text-[#0B1F4D]">
                    Zero Hidden Fees
                  </h3>
                  <p className="mt-2 text-[12px] text-[#64748B] leading-relaxed">
                    What you see is what you pay. Transparent rates for data, flight tickets, gadget prices, and utility bill processing.
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#E1E8F2] bg-[#F8FAFC] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#1877F2]">
                    <PackageCheck size={22} />
                  </div>
                  <h3 className="mt-4 text-[16px] font-bold text-[#0B1F4D]">
                    Escrowed Shopping Protection
                  </h3>
                  <p className="mt-2 text-[12px] text-[#64748B] leading-relaxed">
                    Gadget and phone orders are physically inspected, sealed, and dispatched with insured nationwide doorstep tracking.
                  </p>
                </div>

                <div className="rounded-[20px] border border-[#E1E8F2] bg-[#F8FAFC] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#1877F2]">
                    <Clock size={22} />
                  </div>
                  <h3 className="mt-4 text-[16px] font-bold text-[#0B1F4D]">
                    24/7 Switch Availability
                  </h3>
                  <p className="mt-2 text-[12px] text-[#64748B] leading-relaxed">
                    Late night electricity tokens or data recharges? Our automated backend runs continuously without bank closing hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (3 SIMPLE STEPS) */}
        <section id="how-it-works" className="border-b border-[#E8EEF7] bg-[#F8FAFC] py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1877F2]">
                Simple By Design
              </p>
              <h2 className="mt-2 text-[28px] sm:text-[36px] font-extrabold tracking-[-0.035em] text-[#0B1F4D]">
                Get Started in Three Easy Steps
              </h2>
              <p className="mt-3 text-[14px] sm:text-[15px] text-[#64748B]">
                Vernex keeps the journey frictionless so you can spend less time figuring things out and more time getting things done.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Create Your Free Account",
                  desc: "Register in under 60 seconds with your email and phone number. No lengthy paperwork or activation delays.",
                },
                {
                  step: "02",
                  title: "Fund Your Vernex Wallet",
                  desc: "Send money via standard bank transfer to your dedicated automated account number. Your balance updates immediately.",
                },
                {
                  step: "03",
                  title: "Choose & Deploy Any Service",
                  desc: "Instantly buy virtual numbers, order gadgets, book flights, recharge gaming credits, or pay bills with one click.",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="relative rounded-[20px] border border-[#E1E8F2] bg-white p-7 shadow-xs"
                >
                  <span className="text-[32px] font-black text-[#1877F2]/20">
                    {s.step}
                  </span>
                  <h3 className="mt-3 text-[17px] font-bold text-[#0B1F4D]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#64748B]">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section id="faq" className="border-b border-[#E8EEF7] bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-5 sm:px-8">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1877F2]">
                Have Questions?
              </p>
              <h2 className="mt-2 text-[28px] sm:text-[36px] font-extrabold tracking-[-0.035em] text-[#0B1F4D]">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-[14px] sm:text-[15px] text-[#64748B]">
                Everything you need to know about Vernex services, wallet funding, and guarantees.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {[
                { label: "All Questions", key: "all" },
                { label: "Virtual Numbers", key: "numbers" },
                { label: "Shopping & Flights", key: "shopping" },
                { label: "Bills, Gaming & Wallet", key: "utilities" },
              ].map((btn) => (
                <button
                  key={btn.key}
                  onClick={() => setFaqFilter(btn.key)}
                  className={`rounded-full px-4 py-1.5 text-[12px] font-bold transition cursor-pointer ${
                    faqFilter === btn.key
                      ? "bg-[#0B1F4D] text-white"
                      : "border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Accordion */}
            <div className="mt-8 space-y-3">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="overflow-hidden rounded-[16px] border border-[#E1E8F2] bg-[#F8FAFC] transition"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 text-left font-bold text-[#0B1F4D] transition hover:text-[#1877F2] cursor-pointer"
                    >
                      <span className="text-[14px] sm:text-[15px] pr-4">{faq.q}</span>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-[#64748B] transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-[#1877F2]" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#E8EEF7] bg-white p-5 text-[13px] sm:text-[14px] leading-relaxed text-[#64748B]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* MOBILE PWA CALL TO ACTION */}
        <section className="bg-[#0B1F4D] py-16 sm:py-20 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(24,119,242,0.25),transparent_70%)] pointer-events-none" />

          <div className="relative mx-auto max-w-5xl px-5 sm:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-bold text-[#8FC2FF] backdrop-blur-md">
              <Smartphone size={14} />
              Installable Progressive Web App (PWA)
            </div>

            <h2 className="mt-5 text-[30px] sm:text-[42px] font-black tracking-[-0.04em] text-white leading-tight">
              One Digital Wallet. Every Service at Your Fingertips.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-[14px] sm:text-[16px] text-white/75 leading-relaxed">
              Join thousands of creators, businesses, and everyday users who manage their verification, gadgets, flights, and bills on Vernex.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#1877F2] px-8 text-[14px] font-bold text-white shadow-[0_12px_28px_rgba(24,119,242,0.4)] transition hover:bg-[#166FE5]"
              >
                Create Account Now
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 text-[14px] font-bold text-white transition hover:bg-white/10"
              >
                Sign In to Existing Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#E8EEF7] bg-white py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {/* Col 1: Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <VernexLogo size={34} />
                <span className="text-[18px] font-black tracking-[-0.02em] text-[#0B1F4D]">
                  Vernex Digital
                </span>
              </div>
              <p className="mt-3 max-w-sm text-[12px] leading-relaxed text-[#64748B]">
                Consumer &amp; creator digital infrastructure: instant SMS verification numbers, authentic gadget shopping, airline booking, gaming recharges, and automated utilities.
              </p>
              <div className="mt-5 flex items-center gap-2 text-[11px] font-bold text-[#16A34A]">
                <span className="flex h-2 w-2 rounded-full bg-[#16A34A]" />
                All Services Operating Normally
              </div>
            </div>

            {/* Col 2: Services */}
            <div>
              <p className="text-[12px] font-bold text-[#0B1F4D] uppercase tracking-wider">
                Services
              </p>
              <ul className="mt-3 space-y-2 text-[12px] text-[#64748B]">
                <li>
                  <Link href="/services/virtual-number" className="hover:text-[#1877F2]">
                    Virtual Numbers
                  </Link>
                </li>
                <li>
                  <Link href="/services/shopping" className="hover:text-[#1877F2]">
                    Gadgets &amp; Phones
                  </Link>
                </li>
                <li>
                  <Link href="/services/flights" className="hover:text-[#1877F2]">
                    Flight Booking
                  </Link>
                </li>
                <li>
                  <Link href="/services/gaming" className="hover:text-[#1877F2]">
                    Gaming Top-Up
                  </Link>
                </li>
                <li>
                  <Link href="/services/boost" className="hover:text-[#1877F2]">
                    Social Boost
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Utilities */}
            <div>
              <p className="text-[12px] font-bold text-[#0B1F4D] uppercase tracking-wider">
                Utilities
              </p>
              <ul className="mt-3 space-y-2 text-[12px] text-[#64748B]">
                <li>
                  <Link href="/services/electricity" className="hover:text-[#1877F2]">
                    Prepaid Electricity
                  </Link>
                </li>
                <li>
                  <Link href="/services/cable-tv" className="hover:text-[#1877F2]">
                    Cable TV Unfreeze
                  </Link>
                </li>
                <li>
                  <Link href="/services/data" className="hover:text-[#1877F2]">
                    Data &amp; Airtime VTU
                  </Link>
                </li>
                <li>
                  <Link href="/services/virtual-card" className="hover:text-[#1877F2]">
                    USD Virtual Cards
                  </Link>
                </li>
                <li>
                  <Link href="/services/gift-card" className="hover:text-[#1877F2]">
                    Gift Cards
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Platform & Support */}
            <div>
              <p className="text-[12px] font-bold text-[#0B1F4D] uppercase tracking-wider">
                Account &amp; Legal
              </p>
              <ul className="mt-3 space-y-2 text-[12px] text-[#64748B]">
                <li>
                  <Link href="/login" className="hover:text-[#1877F2]">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-[#1877F2]">
                    Create Account
                  </Link>
                </li>
                <li>
                  <Link href="/profile/faqs" className="hover:text-[#1877F2]">
                    Help Center &amp; FAQs
                  </Link>
                </li>
                <li>
                  <Link href="/profile/privacy" className="hover:text-[#1877F2]">
                    Privacy &amp; Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin"
                    className="text-[#CBD5E1] hover:text-[#94A3B8]"
                  >
                    Admin Console
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-[#E8EEF7] pt-6 text-[11px] text-[#94A3B8]">
            <p>© {new Date().getFullYear()} Vernex Digital. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">
              Grade-1 Fintech Quality · Carrier-Grade Verification Pipelines
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
