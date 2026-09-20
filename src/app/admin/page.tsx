export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-sm bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-sm">
        <h1 className="text-lg font-bold text-[#0F172A] mb-1">Admin Login</h1>
        <p className="text-xs text-[#64748B] mb-6">Panel owner access only</p>
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1.5">Password</label>
            <input
              type="password"
              className="w-full h-11 px-3 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] text-sm outline-none focus:border-[#0284C7]"
            />
          </div>
          <button
            type="button"
            className="w-full h-11 bg-[#0F172A] text-white text-sm font-medium rounded-[10px]"
          >
            Enter Admin
          </button>
        </form>
      </div>
    </div>
  );
}
