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
  const hideMainNav = pathname?.startsWith("/services/gift-card");

  return (
    <AuthGuard>
      {children}
      {!hideMainNav && <BottomNav />}
    </AuthGuard>
  );
}
