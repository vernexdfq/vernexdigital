import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Gift,
  Globe2,
  Rocket,
  ShieldCheck,
  Smartphone,
  Wifi,
} from "lucide-react";
import VernexLogo from "@/components/VernexLogo";

const serviceHighlights = [
  { title: "Virtual Numbers", text: "Connect & verify", icon: Smartphone, href: "/services/virtual-number" },
  { title: "Social Boost", text: "Grow your reach", icon: Rocket, href: "/services/boost" },
  { title: "Data & Airtime", text: "Stay connected", icon: Wifi, href: "/services/data" },
  { title: "Shopping & Flights", text: "Everyday essentials", icon: Globe2, href: "/services" },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    text: "Get your Vernex account ready in a few simple steps.",
  },
  {
    number: "02",
    title: "Fund your wallet",
    text: "Add funds and keep your balance ready for supported services.",
  },
  {
    number: "03",
    title: "Choose & get things done",
    text: "Pick a service, place your order and follow the activity from one place.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#0F172A]">
      <header className="relative z-20 border-b border-[#E8EEF7] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Vernex home">
            <VernexLogo size={38} />
            <span className="text-[18px] font-bold tracking-[-0.03em]">Vernex</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#how-it-works" className="text-[13px] font-medium text-[#64748B] transition hover:text-[#0F172A]">
              How it works
            </a>
            <a href="#services" className="text-[13px] font-medium text-[#64748B] transition hover:text-[#0F172A]">
              Services
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden px-3 py-2 text-[13px] font-semibold text-[#475569] sm:block">
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#1877F2] px-4 text-[13px] font-semibold text-white shadow-[0_7px_18px_rgba(24,119,242,0.20)] transition hover:bg-[#166FE5]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#E8EEF7]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_22%,rgba(24,119,242,0.12),transparent_32%),radial-gradient(circle_at_12%_72%,rgba(24,119,242,0.06),transparent_28%)]" />
          <div className="relative mx-auto grid min-h-[650px] w-full max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.93fr_1.07fr] lg:gap-10 lg:py-24">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DCE9FC] bg-[#F5F9FF] px-3 py-1.5 text-[11px] font-semibold text-[#1877F2]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1877F2]" />
                One account. One wallet. More possibilities.
              </div>

              <h1 className="mt-6 max-w-[620px] text-[44px] font-bold leading-[0.98] tracking-[-0.055em] text-[#0B1F4D] sm:text-[60px] lg:text-[68px]">
                Connect.
                <br />
                Verify.
                <br />
                <span className="text-[#1877F2]">Grow.</span>
              </h1>

              <p className="mt-6 max-w-[510px] text-[15px] leading-7 text-[#64748B] sm:text-[17px]">
                Vernex brings digital services, verification tools, connectivity, shopping and more into one simple mobile-first experience.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] bg-[#1877F2] px-6 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(24,119,242,0.22)] transition hover:-translate-y-0.5 hover:bg-[#166FE5]"
                >
                  Get Started
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[11px] border border-[#D9E2EF] bg-white px-6 text-[14px] font-semibold text-[#334155] transition hover:border-[#B9C8DC] hover:bg-[#F8FAFC]"
                >
                  How It Works
                  <ChevronRight size={16} />
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-[#64748B]">
                {["Mobile-first", "Wallet powered", "Built for everyday use"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check size={13} className="text-[#1877F2]" strokeWidth={2.5} />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-[560px] justify-center lg:justify-end">
              <div className="absolute -right-12 top-8 h-56 w-56 rounded-full bg-[#1877F2]/10 blur-3xl" />
              <div className="absolute -left-10 bottom-4 h-44 w-44 rounded-full bg-[#BFD9FF]/35 blur-3xl" />

              <div className="relative w-[285px] rotate-[2deg] sm:w-[330px] lg:mr-8">
                <div className="rounded-[42px] border-[8px] border-[#111827] bg-[#111827] p-[3px] shadow-[0_35px_80px_rgba(15,23,42,0.25)]">
                  <div className="relative overflow-hidden rounded-[32px] bg-[#F6F9FD]">
                    <div className="flex h-9 items-center justify-between bg-white px-5 text-[9px] font-semibold text-[#64748B]">
                      <span>9:41</span>
                      <span>•••</span>
                    </div>
                    <div className="px-4 pb-7 pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <VernexLogo size={29} />
                          <span className="text-[13px] font-bold text-[#0F172A]">Vernex</span>
                        </div>
                        <div className="h-8 w-8 rounded-full border border-[#DCE9FC] bg-white" />
                      </div>

                      <div className="mt-5 rounded-[18px] bg-[#0B1F4D] p-4 text-white shadow-[0_12px_25px_rgba(11,31,77,0.16)]">
                        <p className="text-[8px] uppercase tracking-[0.12em] text-white/55">Available balance</p>
                        <p className="mt-1.5 text-[23px] font-bold tracking-tight">₦128,450.00</p>
                        <div className="mt-4 flex gap-2">
                          <div className="h-7 flex-1 rounded-[7px] bg-white/10" />
                          <div className="h-7 w-20 rounded-[7px] bg-[#1877F2]" />
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <p className="text-[10px] font-bold text-[#0F172A]">Quick actions</p>
                        <span className="text-[8px] font-semibold text-[#1877F2]">View all</span>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {[Smartphone, Rocket, Wifi, Gift].map((Icon, i) => (
                          <div key={i} className="rounded-[12px] border border-[#E1E8F2] bg-white p-2.5 text-center">
                            <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#EFF6FF] text-[#1877F2]">
                              <Icon size={14} />
                            </div>
                            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-[#E2E8F0]" />
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 rounded-[14px] border border-[#E1E8F2] bg-white p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold">Recent activity</span>
                          <span className="text-[8px] text-[#94A3B8]">Today</span>
                        </div>
                        <div className="mt-3 space-y-2.5">
                          {[1, 2, 3].map((item) => (
                            <div key={item} className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-[#F0F6FF]" />
                              <div className="flex-1">
                                <div className="h-1.5 w-20 rounded-full bg-[#E2E8F0]" />
                                <div className="mt-1.5 h-1 w-12 rounded-full bg-[#F1F5F9]" />
                              </div>
                              <div className="h-1.5 w-10 rounded-full bg-[#DCE9FC]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-[#0F172A]" />
                  </div>
                </div>

                <div className="absolute -bottom-5 -left-12 rounded-[14px] border border-[#E1E8F2] bg-white px-3.5 py-3 shadow-[0_14px_32px_rgba(15,23,42,0.12)] sm:-left-20">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[#EFF6FF] text-[#1877F2]">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-[#0F172A]">Verification ready</p>
                      <p className="mt-0.5 text-[8px] text-[#94A3B8]">Fast digital access</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-10 top-24 rounded-[13px] border border-[#E1E8F2] bg-white px-3 py-2.5 shadow-[0_14px_32px_rgba(15,23,42,0.10)]">
                  <p className="text-[8px] font-semibold text-[#94A3B8]">Wallet</p>
                  <p className="mt-0.5 text-[13px] font-bold text-[#0B1F4D]">Ready to use</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="border-b border-[#E8EEF7] bg-[#F8FAFC]">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-[72px]">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1877F2]">Built around you</p>
                <h2 className="mt-2 text-[27px] font-bold tracking-[-0.035em] text-[#0B1F4D] sm:text-[34px]">
                  The services you need, in one place.
                </h2>
                <p className="mt-3 text-[13px] leading-6 text-[#64748B] sm:text-[15px]">
                  Move between verification, connectivity, growth and everyday digital services without leaving your Vernex account.
                </p>
              </div>
              <Link href="/services" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1877F2]">
                Explore services <ArrowRight size={14} />
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {serviceHighlights.map((service) => {
                const Icon = service.icon;
                return (
                  <Link
                    key={service.title}
                    href={service.href}
                    className="group rounded-[16px] border border-[#E1E8F2] bg-white p-[18px] transition hover:-translate-y-0.5 hover:border-[#BFD7FA] hover:shadow-[0_14px_30px_rgba(15,23,42,0.07)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-[#EFF6FF] text-[#1877F2]">
                        <Icon size={19} />
                      </div>
                      <ArrowRight size={15} className="text-[#CBD5E1] transition group-hover:translate-x-0.5 group-hover:text-[#1877F2]" />
                    </div>
                    <h3 className="mt-6 text-[14px] font-bold text-[#0F172A]">{service.title}</h3>
                    <p className="mt-1 text-[11px] text-[#64748B]">{service.text}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-[88px]">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1877F2]">How it works</p>
              <h2 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.04em] text-[#0B1F4D] sm:text-[36px]">
                Simple by design.
              </h2>
              <p className="mt-4 max-w-md text-[13px] leading-6 text-[#64748B] sm:text-[15px]">
                Vernex keeps the journey clear so you can spend less time finding your way around and more time getting things done.
              </p>
            </div>

            <div className="divide-y divide-[#E8EEF7] border-y border-[#E8EEF7]">
              {steps.map((step) => (
                <div key={step.number} className="grid gap-4 py-6 sm:grid-cols-[70px_1fr] sm:items-start">
                  <span className="text-[12px] font-bold tracking-[0.12em] text-[#1877F2]">{step.number}</span>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#0F172A]">{step.title}</h3>
                    <p className="mt-1.5 max-w-lg text-[12px] leading-5 text-[#64748B]">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-[#E8EEF7] bg-[#0B1F4D]">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 sm:py-18 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8FC2FF]">Vernex on your phone</p>
              <h2 className="mt-2 max-w-2xl text-[28px] font-bold leading-tight tracking-[-0.04em] text-white sm:text-[36px]">
                A web app that feels at home on your phone.
              </h2>
              <p className="mt-3 max-w-xl text-[13px] leading-6 text-white/65 sm:text-[15px]">
                Add Vernex to your home screen for a focused app-like experience. When your browser supports installation, use the install option to keep Vernex one tap away.
              </p>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-white p-3 shadow-[0_18px_40px_rgba(0,0,0,0.20)]">
              <VernexLogo size={54} />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-22">
          <div className="relative overflow-hidden rounded-[24px] border border-[#D8E7FB] bg-[#F3F8FF] px-6 py-12 text-center sm:px-12">
            <div className="absolute -right-20 -top-24 h-60 w-60 rounded-full bg-[#1877F2]/10 blur-3xl" />
            <div className="absolute -bottom-28 -left-16 h-60 w-60 rounded-full bg-[#1877F2]/8 blur-3xl" />
            <div className="relative">
              <VernexLogo size={48} className="mx-auto" />
              <h2 className="mt-5 text-[28px] font-bold tracking-[-0.04em] text-[#0B1F4D] sm:text-[38px]">
                Connect. Verify. Grow.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[13px] leading-6 text-[#64748B] sm:text-[15px]">
                Start with Vernex and keep your digital services together in one clean, mobile-first experience.
              </p>
              <Link
                href="/register"
                className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[11px] bg-[#1877F2] px-7 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(24,119,242,0.20)] transition hover:bg-[#166FE5]"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E8EEF7] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2.5">
            <VernexLogo size={30} />
            <div>
              <p className="text-[13px] font-bold text-[#0F172A]">Vernex</p>
              <p className="text-[10px] text-[#94A3B8]">Connect. Verify. Grow.</p>
            </div>
          </div>
          <div className="flex items-center gap-5 text-[11px] font-medium text-[#64748B]">
            <Link href="/services" className="hover:text-[#0F172A]">Services</Link>
            <Link href="/login" className="hover:text-[#0F172A]">Log in</Link>
            <Link href="/register" className="hover:text-[#0F172A]">Get Started</Link>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[10px] text-[#94A3B8]">© {new Date().getFullYear()} Vernex</p>
            <Link
              href="/admin"
              className="text-[8px] font-medium text-[#CBD5E1] transition hover:text-[#94A3B8]"
              aria-label="Admin"
            >
              admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
