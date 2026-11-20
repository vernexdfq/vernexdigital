"use client";

import { useRouter } from "next/navigation";
import { RentalPage } from "@/components/rent-sms/rental-page";

export default function RentNumberPage() {
  const router = useRouter();
  return <RentalPage onBack={() => router.push("/home")} />;
}
