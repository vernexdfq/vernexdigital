import Link from "next/link";
import {
  Phone, Rocket, FileText, PhoneCall, Wifi, Smartphone, Gift, Sparkles,
} from "lucide-react";

const services = [
  { href: "/services/virtual-number", label: "Virtual Number", desc: "OTP & temporary numbers", icon: Phone },
  { href: "/services/boost", label: "Boost Account", desc: "SMM growth services", icon: Rocket },
  { href: "/services/logs", label: "Buy Logs", desc: "Verified accounts marketplace", icon: FileText },
  { href: "/services/rent-number", label: "Rent Number", desc: "Long-term numbers with calls & SMS", icon: PhoneCall },
  { href: "/services/data", label: "Data", desc: "Mobile data bundles", icon: Wifi },
  { href: "/services/airtime", label: "Airtime", desc: "Instant airtime top-up", icon: Smartphone },
  { href: "/services/gift-card", label: "Gift Card", desc: "Coming soon", icon: Gift },
  { href: "/services/lucky-draw", label: "Lucky Draw", desc: "Coming soon", icon: Sparkles },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">Services</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Choose a service to continue</p>
      </header>
      <div className="px-4 space-y-2">
        {services.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-3 p-4 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#1877F2]/40 transition-colors"
          >
            <div className="w-10 h-10 rounded-[10px] bg-white border border-[#E2E8F0] flex items-center justify-center text-[#1877F2]">
              <s.icon size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#0F172A]">{s.label}</p>
              <p className="text-xs text-[#64748B]">{s.desc}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
