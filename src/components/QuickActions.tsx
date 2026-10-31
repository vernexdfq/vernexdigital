import Link from "next/link";
import {
  Phone,
  Rocket,
  FileText,
  PhoneCall,
  Wifi,
  Smartphone,
  Gift,
  CreditCard,
} from "lucide-react";

const actions = [
  { href: "/services/virtual-number", label: "Virtual Number", icon: Phone, color: "bg-sky-50 text-sky-600" },
  { href: "/services/boost", label: "Boost Account", icon: Rocket, color: "bg-violet-50 text-violet-600" },
  { href: "/services/logs", label: "Buy Logs", icon: FileText, color: "bg-amber-50 text-amber-600" },
  { href: "/services/rent-number", label: "Rent Number", icon: PhoneCall, color: "bg-cyan-50 text-cyan-600" },
  { href: "/services/data", label: "Data", icon: Wifi, color: "bg-indigo-50 text-indigo-600" },
  { href: "/services/airtime", label: "Airtime", icon: Smartphone, color: "bg-blue-50 text-blue-600" },
  { href: "/services/gift-card", label: "Gift Card", icon: Gift, color: "bg-pink-50 text-pink-600" },
  { href: "/services/virtual-card", label: "Virtual Card", icon: CreditCard, color: "bg-emerald-50 text-emerald-600" },
];

export default function QuickActions() {
  return (
    <div>
      <h2 className="text-xs font-semibold tracking-wide text-[#64748B] uppercase mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col items-center gap-2 p-3 rounded-[12px] bg-white border border-[#E2E8F0] shadow-[0_1px_3px_rgba(15,23,42,0.05)] hover:border-[#1877F2]/30 hover:shadow-[0_3px_10px_rgba(15,23,42,0.08)] transition-all duration-150 ease-out active:scale-[0.96] active:translate-y-[1px]"
          >
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-transform duration-150 group-active:scale-90 ${item.color}`}>
              <item.icon size={20} strokeWidth={2} />
            </div>
            <span className="text-[11px] font-medium text-[#0F172A] text-center leading-tight">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
