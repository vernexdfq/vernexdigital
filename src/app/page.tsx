import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-[#E2E8F0] px-4 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0284C7] flex items-center justify-center text-white font-bold text-sm">
            V
          </div>
          <span className="font-semibold text-[#0F172A] text-lg">Vernex Digital</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-[#0284C7] text-white px-4 py-2 rounded-[10px] hover:bg-[#0369A1] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight leading-tight">
          Digital Services.<br />
          <span className="text-[#0284C7]">Simple & Reliable.</span>
        </h1>
        <p className="mt-4 text-[#64748B] text-base sm:text-lg max-w-md leading-relaxed">
          Virtual numbers, social media boosts, airtime, data and more — all from one professional wallet.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-12 px-8 bg-[#0284C7] text-white font-medium rounded-[10px] hover:bg-[#0369A1] transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 border border-[#E2E8F0] text-[#0F172A] font-medium rounded-[10px] hover:bg-[#F8FAFC] transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Feature grid */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          {[
            { title: "Virtual Numbers", desc: "OTP & SMS" },
            { title: "SMM Boost", desc: "Social growth" },
            { title: "Airtime & Data", desc: "Instant top-up" },
            { title: "Number Rental", desc: "Calls & SMS" },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-4 text-left"
            >
              <p className="font-medium text-[#0F172A] text-sm">{item.title}</p>
              <p className="text-xs text-[#64748B] mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] px-4 py-6 text-center">
        <p className="text-xs text-[#64748B]">
          © {new Date().getFullYear()} Vernex Digital. All rights reserved.
        </p>
        <Link
          href="/admin"
          className="inline-block mt-2 text-[10px] text-[#94A3B8] hover:text-[#64748B] transition-colors"
        >
          Admin
        </Link>
      </footer>
    </div>
  );
}
