import { redirect } from "next/navigation";

/**
 * Gift cards are no longer offered on Vernex Digital.
 * Old links land here — send customers to Gaming Top-up instead.
 */
export default function GiftCardPage() {
  redirect("/services/gaming");
}
