"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  X,
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Smartphone,
  Rocket,
  ScrollText,
  Signal,
  Tv,
  Zap,
  LogOut,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const MAIN: NavItem[] = [
  { href: "/admin", label: "Partner Fund", icon: <LayoutDashboard size={18} strokeWidth={2.2} /> },
];

const SERVICES: NavItem[] = [
  { href: "/admin/products", label: "Shopping", icon: <ShoppingBag size={18} strokeWidth={2.2} /> },
  { href: "/admin/shopping-inbox", label: "Shopping inbox", icon: <MessageSquare size={18} strokeWidth={2.2} /> },
  { href: "/admin/virtual-number", label: "Virtual numbers", icon: <Smartphone size={18} strokeWidth={2.2} /> },
  { href: "/services/boost", label: "Boost account", icon: <Rocket size={18} strokeWidth={2.2} /> },
  { href: "/services/logs", label: "Buy logs", icon: <ScrollText size={18} strokeWidth={2.2} /> },
  { href: "/services/airtime", label: "Airtime & data", icon: <Signal size={18} strokeWidth={2.2} /> },
  { href: "/services/cable-tv", label: "Cable TV", icon: <Tv size={18} strokeWidth={2.2} /> },
  { href: "/services/electricity", label: "Electricity", icon: <Zap size={18} strokeWidth={2.2} /> },
];

export function AdminMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open admin menu"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B1220] text-white shadow-sm transition active:scale-[0.97]"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 4h12M2 8h12M2 12h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export default function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleLogout() {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.removeItem("vernex_admin");
    } catch {
      /* ignore */
    }
    onClose();
    router.replace("/admin/login");
  }

  if (!open) return null;

  const navItem = (item: NavItem) => {
    const active = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onClose}
        className={
          "mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors " +
          (active
            ? "bg-[#0B1220] text-white"
            : "text-slate-600 hover:bg-slate-50 active:bg-slate-100")
        }
      >
        <span className={active ? "text-emerald-400" : "text-slate-400"}>
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
      />

      <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B1220] text-white">
              <Shield size={16} strokeWidth={2.4} />
            </span>
            <div>
              <p className="text-[14px] font-extrabold leading-tight text-slate-900">Vernex Admin</p>
              <p className="text-[11px] font-semibold text-slate-400">vernexdigital panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 active:opacity-70"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {MAIN.map(navItem)}

          <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-300">
            Services
          </p>
          {SERVICES.map(navItem)}
        </nav>

        <div className="border-t border-slate-100 px-2.5 py-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut size={18} strokeWidth={2.2} className="text-red-500" />
            Log out
          </button>
          <p className="px-3 pt-2 text-[10px] text-slate-300">© Vernex Digital</p>
        </div>
      </div>
    </div>
  );
}
