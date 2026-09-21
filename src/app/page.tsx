import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Gift,
  Phone,
  PhoneCall,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WalletCards,
  Wifi,
  Zap,
} from "lucide-react";

const services = [
  {
    href: "/services/virtual-number",
    title: "Virtual Numbers",
    description: "Get temporary numbers for OTP and SMS verification.",
    icon: Phone,
    tag: "Verification",
  },
  {
    href: "/services/rent-number",
    title: "Rent a Number",
    description: "Keep a dedicated number for longer-term calls and SMS.",
    icon: PhoneCall,
    tag: "Dedicated lines",
  },
  {
    href: "/services/boost",
    title: "Boost Account",
    description: "Order social growth services with clear delivery tracking.",
    icon: Rocket,
    tag: "Social growth",
  },
  {
    href: "/services/logs",
    title: "Buy Logs",
    description: "Browse available digital account inventory and delivery options.",
    icon: FileText,
    tag: "Marketplace",
  },
  {
    href: "/services/data",
    title: "Data",
    description: "Purchase mobile data bundles with fast digital delivery.",
    icon: Wifi,
    tag: "Connectivity",
  },
  {
    href: "/services/airtime",
    title: "Airtime",
    description: "Top up a mobile line quickly from your Vernex wallet.",
    icon: Smartphone,
    tag: "Top up",
  },
  {
    href: "/services/gift-card",
    title: "Gift Cards",
    description: "A digital gift-card marketplace planned for the platform.",
    icon: Gift,
    tag: "Coming soon",
    comingSoon: true,
  },
  {
    href: "/services/lucky-draw",
    title: "Lucky Draw",
    description: "A rewards experience planned for Vernex users.",
    icon: Sparkles,
    tag: "Coming soon",
    comingSoon: true,
  },
];

const benefits = [
  {
    icon: WalletCards,
    title: "One wallet",
    text: "Fund once and use your available balance across supported services.",
  },
  {
    icon: ShieldCheck,
    title: "Clear activity",
    text: "Keep wallet movements and service orders in one easy-to-follow record.",
  },
  {
    icon: Zap,
    title: "Built for speed",
    text: "A focused mobile experience for everyday digital service purchases.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Existing landing header */}
      <header className="border-b border-[#E2E8F0] px-4 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <span className="font-semibold text-[#0F172A] text-lg">Vernex Digital</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            Login
          </Link>
          <Link
            href="/home"
            className="text-sm font-medium bg-[#1877F2] text-white px-4 py-2 rounded-[10px] hover:bg-[#166FE5] transition-colors"
          >
            Open App
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Existing hero — intentionally kept */}
        <section className="flex flex-col items-center justify-center px-4 py-16 text-center max-w-3xl mx-auto">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#1877F2] mb-3">
            Vernex Digital
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight leading-tight">
            Digital Services.<br />
            <span className="text-[#1877F2]">Simple & Reliable.</span>
          </h1>
          <p className="mt-4 text-[#64748B] text-base sm:text-lg max-w-md leading-relaxed">
            Virtual numbers, social media boosts, airtime, data and more — all from one professional wallet.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/home"
              className="inline-flex items-center justify-center h-12 px-8 bg-[#1877F2] text-white font-medium rounded-[10px] hover:bg-[#166FE5] transition-colors"
            >
              Enter Dashboard
            </Link>
            <a
              href="#services"
              className="inline-flex items-center justify-center h-12 px-8 border border-[#E2E8F0] text-[#0F172A] font-medium rounded-[10px] hover:bg-[#F8FAFC] transition-colors"
            >
              Explore Services
            </a>
          </div>
          <p className="mt-4 text-xs text-[#94A3B8]">
            One account. One wallet. Multiple digital services.
          </p>

          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {[
              { title: "Virtual Numbers", desc: "OTP & SMS" },
              { title: "SMM Boost", desc: "Social growth" },
              { title: "Airtime & Data", desc: "Instant top-up" },
              { title: "Number Rental", desc: "Calls & SMS" },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-4 text-left"
              >
                <p className="font-medium text-[#0F172A] text-sm">{item.title}</p>
                <p className="text-xs text-[#64748B] mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Full service catalogue */}
        <section id="services" className="border-y border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#1877F2]">
                Everything in one place
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                Services built around your everyday digital needs.
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#64748B]">
                Explore the Vernex catalogue. Start with the service you need and manage
                your purchases from the same account and wallet.
              </p>
            </div>

            <div className="mt-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Link
                    key={service.href}
                    href={service.href}
                    className="group flex min-h-[190px] flex-col rounded-[14px] border border-[#E2E8F0] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#1877F2]/40 hover:shadow-[0_10px_28px_rgba(15,23,42,0.07)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#DCE9FC] bg-[#EFF6FF] text-[#1877F2]">
                        <Icon size={20} strokeWidth={1.9} />
                      </div>
                      <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-semibold text-[#64748B]">
                        {service.tag}
                      </span>
                    </div>

                    <div className="mt-5">
                      <h3 className="text-[15px] font-semibold text-[#0F172A]">
                        {service.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#64748B]">
                        {service.description}
                      </p>
                    </div>

                    <div className="mt-auto pt-5 flex items-center gap-1 text-xs font-semibold text-[#1877F2]">
                      {service.comingSoon ? "Learn more" : "Explore service"}
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Wallet value proposition */}
        <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#1877F2]">
                One wallet
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
                Fund once. Use your balance across Vernex.
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#64748B]">
                Your wallet is the centre of the experience. Fund your account, choose a
                service, review the order and keep the resulting activity in one place.
              </p>

              <div className="mt-7 space-y-4">
                {[
                  "A single balance for supported services",
                  "Clear order and wallet activity",
                  "Designed for fast mobile transactions",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="shrink-0 text-[#1877F2]" size={18} />
                    <span className="text-sm font-medium text-[#334155]">{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/home"
                className="mt-8 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-[10px] bg-[#1877F2] text-white text-sm font-semibold hover:bg-[#166FE5] transition-colors"
              >
                Open your wallet
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="rounded-[18px] border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:p-6">
              <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
                      Available balance
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-[#0F172A]">
                      ₦0.00
                    </p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#EFF6FF] text-[#1877F2]">
                    <WalletCards size={21} />
                  </div>
                </div>

                <div className="mt-7 h-px bg-[#E2E8F0]" />

                <div className="mt-5 flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Wallet activity</span>
                  <span className="font-semibold text-[#16A34A]">Ready to use</span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-[#1877F2]" />
                  <div className="h-2 w-12 rounded-full bg-[#E2E8F0]" />
                  <div className="h-2 w-8 rounded-full bg-[#E2E8F0]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Vernex */}
        <section className="bg-[#0F172A] text-white">
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#93C5FD]">
                The Vernex experience
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
                A simpler way to manage digital services.
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-300">
                Everything is organised around a straightforward customer journey:
                fund, choose, review and track.
              </p>
            </div>

            <div className="mt-9 grid md:grid-cols-3 gap-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="rounded-[14px] border border-white/10 bg-white/[0.04] p-5"
                  >
                    <Icon size={21} className="text-[#93C5FD]" />
                    <h3 className="mt-5 text-sm font-semibold">{benefit.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {benefit.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-3 border-t border-white/10 pt-7">
              {[
                { icon: Clock3, label: "Fast digital delivery" },
                { icon: ShieldCheck, label: "Clear account activity" },
                { icon: WalletCards, label: "Wallet-first experience" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-2.5 text-xs font-medium text-slate-200">
                    <Icon size={16} className="text-[#93C5FD]" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
          <div className="rounded-[18px] border border-[#DCE9FC] bg-[#EFF6FF] px-5 py-10 sm:px-10 text-center">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#1877F2]">
              Ready when you are
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Everything you need, one Vernex account.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#64748B]">
              Open the dashboard to explore services, fund your wallet and manage your
              digital activity from one place.
            </p>
            <Link
              href="/home"
              className="mt-7 inline-flex items-center justify-center gap-2 h-11 px-6 rounded-[10px] bg-[#1877F2] text-white text-sm font-semibold hover:bg-[#166FE5] transition-colors"
            >
              Open Vernex
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E2E8F0] px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">Vernex Digital</p>
            <p className="mt-1 text-xs text-[#64748B]">
              Digital services, organised around one wallet.
            </p>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/services" className="text-xs font-medium text-[#64748B] hover:text-[#0F172A]">
              Services
            </Link>
            <Link href="/home" className="text-xs font-medium text-[#64748B] hover:text-[#0F172A]">
              Open App
            </Link>
            <Link href="/admin" className="text-[10px] text-[#CBD5E1] hover:text-[#94A3B8]">
              Admin
            </Link>
          </div>
        </div>
        <p className="max-w-5xl mx-auto mt-6 text-center sm:text-left text-[11px] text-[#94A3B8]">
          © {new Date().getFullYear()} Vernex Digital. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
