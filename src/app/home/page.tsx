import WalletCard from "@/components/WalletCard";
import QuickActions from "@/components/QuickActions";
import PromoCarousel from "@/components/PromoCarousel";
import VernexLogo from "@/components/VernexLogo";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F6F7FA] pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <VernexLogo size={40} className="rounded-full shadow-[0_2px_8px_rgba(15,23,42,0.12)] ring-1 ring-black/5" />
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">Good Afternoon</p>
            <p className="text-xs text-[#64748B]">Your Vernex Dashboard</p>
          </div>
        </div>
        <button
          className="w-9 h-9 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all active:scale-[0.94] active:translate-y-[1px]"
          aria-label="Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </header>

      <div className="px-4 space-y-5">
        <WalletCard />
        <QuickActions />

        {/* Compact promo carousel — native, non-intrusive */}
        <PromoCarousel />

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold tracking-wide text-[#64748B] uppercase">
              Recent Activity
            </h2>
            <Link href="/history" className="text-xs font-medium text-[#1877F2]">
              View all →
            </Link>
          </div>
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 text-center shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
            <p className="text-sm text-[#64748B]">No recent activity yet</p>
            <p className="text-xs text-[#94A3B8] mt-1">Your transactions will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
