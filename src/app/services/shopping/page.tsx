import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function ShoppingPage() {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0]">
        <div className="h-14 px-4 flex items-center gap-3">
          <Link
            href="/services"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9]"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[15px] font-semibold text-[#0F172A]">Shopping</h1>
        </div>
      </header>
      <div className="px-4 pt-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-[16px] bg-[#EFF6FF] text-[#1877F2] flex items-center justify-center">
          <ShoppingBag size={28} />
        </div>
        <h2 className="mt-5 text-lg font-bold text-[#0F172A]">
          Shop gadgets & more
        </h2>
        <p className="mt-2 text-sm text-[#64748B] max-w-xs">
          Phones, laptops, AirPods, accessories and more — catalog coming soon.
        </p>
      </div>
    </div>
  );
}
