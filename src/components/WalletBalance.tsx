"use client";

import { useUser } from "@/lib/useUser";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Shared live wallet amount for headers across service pages */
export default function WalletBalance({
  className = "text-sm font-semibold text-[#16A34A] tabular-nums",
}: {
  className?: string;
}) {
  const { wallet, loading } = useUser();
  if (loading) {
    return <span className={className}>₦…</span>;
  }
  return <span className={className}>{formatNaira(wallet.balance)}</span>;
}
