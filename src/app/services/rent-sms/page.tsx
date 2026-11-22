"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/lib/useUser";
import { RentalPage } from "@/components/rent-sms/rental-page";

/**
 * Rent-for-SMS — permanent customer order page.
 * Same experience as the parent (verxor.com): live Textverified service list,
 * live per-duration quotes, state-grouped US area codes, rental history and
 * a live SMS inbox. Everything flows through the panel's own backend routes,
 * which use the Verxor panel key server-side only.
 */
export default function RentSmsPage() {
  const router = useRouter();
  const { profile, wallet } = useUser();

  return (
    <RentalPage
      onBack={() => router.push("/home")}
      session={{ userId: profile?.id, balanceNgn: wallet?.balance }}
      onFund={() => router.push("/fund")}
    />
  );
}
