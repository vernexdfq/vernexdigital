"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, Wallet, History, User } from "lucide-react";

const items = [
  { href: "/home", label: "Home", icon: Home, exact: false },
  // Services only active on the hub page itself — not on /services/*
  // so Quick Actions open service pages without highlighting Services.
  { href: "/services", label: "Services", icon: Grid3X3, exact: true },
  { href: "/fund", label: "Fund", icon: Wallet, exact: false },
  { href: "/history", label: "History", icon: History, exact: false },
  { href: "/profile", label: "Profile", icon: User, exact: false },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E2E8F0] safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-colors ${
                active ? "text-[#1877F2]" : "text-[#64748B]"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
