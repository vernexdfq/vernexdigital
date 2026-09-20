export default function FundPage() {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">Fund Wallet</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Add money via XixaPay</p>
      </header>
      <div className="px-4">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#64748B] mb-1.5">Amount (₦)</label>
            <input
              type="number"
              placeholder="5000"
              className="w-full h-12 px-3 rounded-[10px] border border-[#E2E8F0] bg-white text-lg font-semibold outline-none focus:border-[#1877F2]"
            />
          </div>
          <div className="flex gap-2">
            {[1000, 2000, 5000, 10000].map((amt) => (
              <button
                key={amt}
                className="flex-1 h-9 text-xs font-medium rounded-[8px] border border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#1877F2]"
              >
                ₦{amt.toLocaleString()}
              </button>
            ))}
          </div>
          <button className="w-full h-11 bg-[#1877F2] text-white text-sm font-medium rounded-[10px] hover:bg-[#166FE5]">
            Continue to Payment
          </button>
          <p className="text-[11px] text-center text-[#94A3B8]">
            Secured by XixaPay · Funds credited after confirmation
          </p>
        </div>
      </div>
    </div>
  );
}
