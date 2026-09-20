export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">History</h1>
        <p className="text-sm text-[#64748B] mt-0.5">All transactions & orders</p>
      </header>
      <div className="px-4">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-8 text-center">
          <p className="text-sm text-[#64748B]">No transactions yet</p>
          <p className="text-xs text-[#94A3B8] mt-1">Fund your wallet to get started</p>
        </div>
      </div>
    </div>
  );
}
