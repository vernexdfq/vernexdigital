"use client";

import { useEffect, useState } from "react";
import { Save, Loader2, CircleAlert, Check, PhoneCall } from "lucide-react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@/lib/supabase/client";

type PricingData = {
  persisted: boolean;
  multiplier: number;
  defaultMultiplier: number;
  min: number;
  max: number;
  note: string;
};

function formatNgn(n: number) {
  return Number(n || 0).toLocaleString("en-NG");
}

export default function RentSmsPricingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<PricingData | null>(null);
  const [draft, setDraft] = useState("");
  const [sample, setSample] = useState(9150);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }
      const res = await fetch("/api/rent-sms/pricing", { headers, cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setData(payload);
        setDraft(String(payload.multiplier));
      } else {
        setError(payload.error || "Could not load pricing.");
      }
    } catch {
      setError("Could not load pricing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!data) return;
    const m = Number(draft);
    if (!Number.isFinite(m) || m < data.min || m > data.max) {
      setError(`Multiplier must be between ${data.min} and ${data.max}.`);
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }
      const res = await fetch("/api/rent-sms/pricing", {
        method: "PUT",
        headers,
        body: JSON.stringify({ multiplier: m }),
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setMessage("Multiplier saved. New Rent-for-SMS prices apply immediately.");
        await load();
      } else {
        setError(payload.error || "Could not save the multiplier.");
      }
    } catch {
      setError("Could not save the multiplier.");
    } finally {
      setSaving(false);
    }
  };

  const current = Number(draft);
  const valid = Number.isFinite(current) && !!data && current >= data.min && current <= data.max;

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#E2E8F0] bg-white/90 px-4 py-4 backdrop-blur">
        <AdminMenuButton onClick={() => setMenuOpen(true)} />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
            Vernex Admin
          </p>
          <h1 className="text-sm font-bold text-[#0F172A]">Rent-for-SMS pricing</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Loader2 size={16} className="animate-spin" /> Loading pricing…
          </div>
        ) : error && !data ? (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert size={16} /> {error}
          </div>
        ) : data ? (
          <>
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <CircleAlert size={16} /> {error}
              </div>
            )}
            {message && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <Check size={16} /> {message}
              </div>
            )}

            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-cyan-50 text-cyan-600">
                  <PhoneCall size={18} strokeWidth={2.3} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A]">Rent-for-SMS multiplier</h2>
                  <p className="text-xs text-[#64748B]">{data.note}</p>
                </div>
              </div>

              <label className="mb-1 block text-xs font-semibold text-[#64748B]">
                Multiplier ({data.min} – {data.max})
              </label>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0F172A]">Verxor retail ×</span>
                <input
                  type="number"
                  step="0.05"
                  min={data.min}
                  max={data.max}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-24 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm font-semibold text-[#0F172A] focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="mb-4 rounded-xl bg-[#F8FAFC] px-4 py-3 text-xs text-[#64748B]">
                Example: a rental priced at ₦{formatNgn(sample)} on verxor.com sells here for{" "}
                <span className="font-semibold text-[#0F172A]">
                  ₦{formatNgn(valid ? Math.ceil((sample * current) / 50) * 50 : sample)}
                </span>{" "}
                (rounded up to the nearest ₦50).
              </div>

              <button
                onClick={save}
                disabled={saving || !valid}
                className="flex items-center gap-2 rounded-xl bg-[#0F172A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "Saving…" : "Save multiplier"}
              </button>

              <p className="mt-3 text-[11px] text-[#94A3B8]">
                {data.persisted
                  ? "Saved pricing is active. Wholesale cost is Verxor's panel-tier charge to us."
                  : "No saved value yet — the default (same price as Verxor) is active."}
              </p>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
