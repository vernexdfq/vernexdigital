export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">Profile</h1>
      </header>
      <div className="px-4 space-y-4">
        <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px]">
          <div className="w-12 h-12 rounded-full bg-[#0284C7] flex items-center justify-center text-white font-semibold">
            A
          </div>
          <div>
            <p className="font-medium text-[#0F172A]">User</p>
            <p className="text-xs text-[#64748B]">Member since Sep 2026</p>
          </div>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] divide-y divide-[#E2E8F0]">
          {["Account Details", "Security", "Support", "About"].map((item) => (
            <button key={item} className="w-full text-left px-4 py-3.5 text-sm text-[#0F172A] hover:bg-white">
              {item}
            </button>
          ))}
        </div>
        <button className="w-full h-11 text-sm font-medium text-red-600 border border-red-100 rounded-[10px] hover:bg-red-50">
          Log Out
        </button>
      </div>
    </div>
  );
}
