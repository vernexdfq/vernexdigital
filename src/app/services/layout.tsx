"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideMainNav = pathname?.startsWith("/services/gift-card");

  return (
    <>
      {children}
      {!hideMainNav && <BottomNav />}
    </>
  );
}
