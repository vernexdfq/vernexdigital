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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] safe-area-pb shadow-[0_-2px_12px_rgba(15,23,42,0.04)]">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {items.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              scroll={false}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-lg transition-all duration-150 ease-out active:scale-[0.92] active:translate-y-[1px] \${
                active ? "text-[#0B1B3A]" : "text-[#94A3B8]"
              }`}
            >
              <Icon size={21} strokeWidth={active ? 2.4 : 1.7} />
              <span className={`text-[10px] \${
                active ? "font-semibold" : "font-medium"
              }`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
