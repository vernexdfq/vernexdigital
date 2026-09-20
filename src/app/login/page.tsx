import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white px-4">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full py-12">
        <div className="mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#0284C7] flex items-center justify-center text-white font-bold mb-4">
            V
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Welcome back</h1>
          <p className="text-sm text-[#64748B] mt-1">Sign in to your Vernex account</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1.5">Email or Phone</label>
            <input
              type="text"
              placeholder="you@example.com"
              className="w-full h-11 px-3 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1.5">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full h-11 px-3 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#0F172A] outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20"
            />
          </div>
          <Link
            href="/home"
            className="flex items-center justify-center w-full h-11 bg-[#0284C7] text-white text-sm font-medium rounded-[10px] hover:bg-[#0369A1] transition-colors"
          >
            Sign In
          </Link>
        </form>

        <div className="mt-6">
          <Link
            href="/home"
            className="flex items-center justify-center w-full h-11 border border-[#E2E8F0] text-[#0F172A] text-sm font-medium rounded-[10px] hover:bg-[#F8FAFC] transition-colors"
          >
            Continue without login (Preview)
          </Link>
        </div>

        <p className="text-center text-sm text-[#64748B] mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#0284C7] font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
