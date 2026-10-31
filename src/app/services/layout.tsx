"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import AuthGuard from "@/components/AuthGuard";

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Deep service pages (boost, virtual-number, etc.) run full-screen like the
  // reference: no bottom nav — the page has its own back navigation.
  const showMainNav = !pathname || pathname === "/services";

  return (
    <AuthGuard>
      {children}
      {showMainNav && <BottomNav />}
    </AuthGuard>
  );
}
