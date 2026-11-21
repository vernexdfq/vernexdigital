"use client";

import { useEffect, useState } from "react";
import { Wifi, Loader2, RefreshCw, CircleAlert, Check } from "lucide-react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import { createBrowserClient } from "@/lib/supabase/client";

type Row = {
  planId: number;
  network: string;
  size: string;
  days: string;
  tab: string;
  childPrice: number;
  defaultPrice: number;
  yourPrice: number;
  label: string | null;
  featured: boolean;
  visible: boolean;
  hasOverride: boolean;
};

function naira(n: number) {
  return "₦" + Math.round(Number(n) || 0).toLocaleString("en-NG");
}

function daysLabel(d: string) {
  const n = Number(d);
  if (n === 365) return "1 year";
  if (n >= 30 && n % 30 === 0) return n / 30 + " month" + (n / 30 > 1 ? "s" : "");
  return n + " day" + (n > 1 ? "s" : "");
}

export default function DataPricingAdminPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [net, setNet] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const key = (r: Row) => `${r.network}-${r.planId}`;

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
      const res = await fetch("/api/admin/data-pricing", { cache: "no-store", headers });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.ok) {
        setRows(payload.rows as Row[]);
        setDrafts({});
      } else {
        setError(payload.error || "Could not load data pricing.");
      }
    } catch {
      setError("Could not load data pricing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  async function save(r: Row, priceStr: string, visible: boolean, featured: boolean) {
    setSavingId(key(r));
    setSavedId(null);
    setError("");
    try {
      const s = priceStr.trim();
      const price = s === "" ? null : Number(s.replace(/[^0-9.]/g, ""));
      if (s !== "" && (!price || price <= 0)) {
        setError("Enter a valid price or leave the field blank.");
        return;
      }
      const supabase = createBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }
      const res = await fetch("/api/admin/data-pricing", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          planId: r.planId,
          network: r.network,
          yourPrice: price,
          visible,
          featured,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload.ok === false) {
        setError(payload.error || "Save failed.");
      } else {
        setSavedId(key(r));
        await load();
        setTimeout(() => setSavedId(null), 2000);
      }
    } catch {
      setError("Save failed.");
    } finally {
      setSavingId(null);
    }
  }

  const filtered = rows.filter((r) =>
    (net === "all" || r.network === net) &&
    (!q.trim() || (r.size + " " + r.planId).toLowerCase().includes(q.trim().toLowerCase())),
  );

  const NETWORKS = [
    { id: "all", label: "All" },
    { id: "mtn", label: "MTN" },
    { id: "airtel", label: "Airtel" },
    { id: "glo", label: "Glo" },
    { id: "9mobile", label: "9mobile" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#E2E8F0] bg-white/90 px-4 py-4 backdrop-blur">
        <AdminMenuButton onClick={() => setMenuOpen(true)} />
        <div className="flex flex-1 items-center gap-2">
          <Wifi size={16} className="text-[#1877F2]" strokeWidth={2.4} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">Vernex Admin</p>
            <h1 className="text-[17px] font-extrabold tracking-tight text-[#0F172A]">Data pricing</h1>
          </div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#DCE3EE] bg-white px-3 text-[12px] font-bold text-[#1877F2] shadow-sm active:scale-[0.98]">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      <main className="mx-auto max-w-[760px] space-y-4 px-4 py-5">
        <p className="text-[12px] leading-relaxed text-[#64748B]">
          Set your own selling price per bundle (blank = same as Verxor retail). The
          &ldquo;cost to you&rdquo; column is fixed by Verxor. Hide a bundle or flag it as hot here too.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {NETWORKS.map((n) => (
            <button key={n.id} type="button" onClick={() => setNet(n.id)}
              className={`h-9 min-w-[80px] rounded-full px-4 text-[12px] font-bold transition-colors ${
                net === n.id
                  ? "bg-[#1877F2] text-white shadow-md"
                  : "border border-[#E2E8F0] bg-white text-[#475569]"
              }`}>
              {n.label}
            </button>
          ))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search size or ID"
            className="ml-auto h-9 rounded-[10px] border border-[#E2E8F0] px-3 text-[12px]" />
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-[#F2D4D1] bg-[#FFF8F7] px-4 py-3 text-[12px] font-semibold text-[#A8463D]">
            <CircleAlert size={15} /> {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#E8EEF5] bg-[#F8FAFC] py-6">
            <Loader2 size={16} className="animate-spin text-[#94A3B8]" />
            <span className="text-[12px] font-semibold text-[#64748B]">Loading bundles…</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((r0) => {
              const r = { ...r0 };
              const k = key(r);
              const price = drafts[k] ?? (r.yourPrice !== r.defaultPrice ? String(r.yourPrice) : "");
              return (
                <div key={k} className="rounded-2xl border border-[#E2E8F0] bg-white p-3.5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold text-[#0F172A]">
                        {r.size} <span className="text-[11px] font-semibold text-[#94A3B8]">{daysLabel(r.days)}</span>
                      </p>
                      <p className="text-[11px] font-semibold text-[#94A3B8]">
                        #{r.planId} · cost to you {naira(r.childPrice)} · Verxor retail {naira(r.defaultPrice)}
                      </p>
                    </div>
                    {r.hasOverride ? (
                      <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold text-[#1877F2]">edited</span>
                    ) : null}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B]">
                      Your price (₦)
                      <input
                        value={price}
                        onChange={(e) => setDrafts((d) => ({ ...d, [k]: e.target.value.replace(/[^0-9.]/g, "") }))}
                        placeholder={String(r.defaultPrice)}
                        inputMode="decimal"
                        className="h-8 w-[90px] rounded-[8px] border border-[#E2E8F0] px-2 text-[12px] tabular-nums focus:border-[#1877F2] focus:outline-none"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B]">
                      <input
                        type="checkbox"
                        checked={r.visible}
                        onChange={(e) => {
                          setRows((list) => list.map((x) => (key(x) === k ? { ...x, visible: e.target.checked } : x)));
                        }}
                        className="accent-[#1877F2]"
                      />
                      Visible
                    </label>
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748B]">
                      <input
                        type="checkbox"
                        checked={r.featured}
                        onChange={(e) => {
                          setRows((list) => list.map((x) => (key(x) === k ? { ...x, featured: e.target.checked } : x)));
                        }}
                        className="accent-[#1877F2]"
                      />
                      Hot pick
                    </label>
                    <button
                      type="button"
                      disabled={savingId === k}
                      onClick={() => void save(r, price, r.visible, r.featured)}
                      className={`ml-auto inline-flex h-8 items-center gap-1 rounded-[8px] px-3 text-[12px] font-bold text-white active:scale-[0.98] ${
                        savedId === k ? "bg-emerald-600" : "bg-[#1877F2]"
                      }`}
                    >
                      {savingId === k ? <Loader2 size={12} className="animate-spin" /> : savedId === k ? <Check size={12} /> : null}
                      {savedId === k ? "Saved" : "Save"}
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-[#94A3B8]">No bundles match.</p>
            ) : null}
          </div>
        )}

        <p className="pb-6 text-center text-[11px] text-[#94A3B8]">
          Changes apply instantly on your Data page. Cost to you is set by Verxor and never editable here.
        </p>
      </main>
    </div>
  );
}
