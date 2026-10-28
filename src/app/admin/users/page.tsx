"use client";

import { useCallback, useEffect, useState } from "react";
import AdminSidebar, { AdminMenuButton } from "@/components/admin/AdminSidebar";
import { ArrowLeft, Loader2, Search, SearchX, UserRound, Wallet } from "lucide-react";
import {
  adjustUserWallet,
  fetchAllUsers,
  fetchUserTransactions,
  saveUserPhone,
  type AdminTxn,
  type AdminUser,
} from "@/lib/adminUsers";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

function naira(n: number) {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

function when(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminUsersPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<AdminUser | null>(null);

  // adjust wallet
  const [mode, setMode] = useState<"credit" | "debit">("credit");
  const [amountInput, setAmountInput] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  // profile + txns
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [txns, setTxns] = useState<AdminTxn[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await fetchAllUsers());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadTxns = useCallback(async (userId: string) => {
    setTxnsLoading(true);
    try {
      setTxns(await fetchUserTransactions(userId));
    } catch {
      setTxns([]);
    } finally {
      setTxnsLoading(false);
    }
  }, []);

  function openUser(u: AdminUser) {
    setOpen(u);
    setMode("credit");
    setAmountInput("");
    setNote("");
    setFlash(null);
    setPhoneDraft(u.phone);
    setTxns([]);
    loadTxns(u.id);
  }

  function patchOpen(patch: Partial<AdminUser>) {
    setOpen((prev) => (prev ? { ...prev, ...patch } : prev));
    setUsers((prev) => prev.map((u) => (u.id === (open?.id ?? "") ? { ...u, ...patch } : u)));
  }

  async function submitAdjust() {
    if (!open || busy) return;
    const amount = Math.round(Number(amountInput.replace(/[^0-9]/g, "")));
    if (!Number.isFinite(amount) || amount <= 0) {
      setFlash({ ok: false, text: "Enter a valid amount." });
      return;
    }
    const signed = mode === "debit" ? -amount : amount;
    if (mode === "debit" && amount > open.balance) {
      setFlash({ ok: false, text: "Debit exceeds the user wallet balance." });
      return;
    }
    setBusy(true);
    setFlash(null);
    try {
      const newBalance = await adjustUserWallet(open.id, signed, note.trim());
      patchOpen({ balance: newBalance });
      setFlash({
        ok: true,
        text: (mode === "credit" ? "Credited " : "Debited ") + naira(amount) + " · new balance " + naira(newBalance),
      });
      setAmountInput("");
      setNote("");
      loadTxns(open.id);
    } catch (e) {
      setFlash({ ok: false, text: e instanceof Error ? e.message : "Could not adjust the wallet." });
    } finally {
      setBusy(false);
    }
  }

  async function submitPhone() {
    if (!open || phoneBusy) return;
    setPhoneBusy(true);
    setFlash(null);
    try {
      await saveUserPhone(open.id, phoneDraft.trim());
      patchOpen({ phone: phoneDraft.trim() });
      setFlash({ ok: true, text: "Phone number updated." });
    } catch (e) {
      setFlash({ ok: false, text: e instanceof Error ? e.message : "Could not update phone number." });
    } finally {
      setPhoneBusy(false);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.toLowerCase().includes(q) ||
      u.referralCode.toLowerCase().includes(q)
    );
  });

  const totalBalances = users.reduce((sum, u) => sum + u.balance, 0);

  if (open) {
    return (
      <div className="min-h-screen bg-[#F6F8FB] pb-16">
        <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

        <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-lg items-center gap-2.5 px-4">
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"
              aria-label="Back to users"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-bold text-[#0F172A]">{open.fullName}</h1>
              <p className="truncate text-[11px] font-semibold text-[#64748B]">{open.email || open.phone || open.id.slice(0, 8)}</p>
            </div>
            {open.isAdmin && (
              <span className="shrink-0 rounded-full bg-[#0B1220] px-2.5 py-1 text-[10px] font-bold text-white">Admin</span>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0B1220] via-[#111827] to-[#0F172A] px-5 py-5 text-white shadow-[0_12px_32px_rgba(15,23,42,0.22)]">
            <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#1877F2]/20 blur-2xl" aria-hidden />
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Wallet balance</p>
            <p className="mt-2 text-[32px] font-extrabold leading-none tracking-tight tabular-nums">{naira(open.balance)}</p>
            <p className="mt-3 text-[12px] font-semibold text-slate-400">
              Joined {when(open.createdAt)}
              {open.referralCode ? " · Ref: " + open.referralCode : ""}
            </p>
          </div>

          <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-[#475569]" strokeWidth={2.4} />
              <span className="text-[13px] font-bold text-[#0F172A]">Adjust wallet</span>
            </div>
            <p className="mt-1 text-[12px] text-[#64748B]">
              Manually credit a wallet when funding failed, or debit to correct a balance.
            </p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setMode("credit")}
                className={"h-10 flex-1 rounded-xl border text-[12px] font-bold transition active:scale-[0.97] " + (mode === "credit" ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#E2E8F0] bg-white text-emerald-600")}
              >
                + Credit
              </button>
              <button
                type="button"
                onClick={() => setMode("debit")}
                className={"h-10 flex-1 rounded-xl border text-[12px] font-bold transition active:scale-[0.97] " + (mode === "debit" ? "border-red-500 bg-red-500 text-white" : "border-[#E2E8F0] bg-white text-red-600")}
              >
                − Debit
              </button>
            </div>

            <div className="relative mt-3">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-bold text-[#64748B]">₦</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9]/g, ""))}
                className="h-14 w-full rounded-2xl border-2 border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-4 text-[18px] font-extrabold tabular-nums text-[#0F172A] outline-none transition focus:border-[#1877F2] focus:bg-white focus:ring-4 focus:ring-[#1877F2]/15"
                placeholder="Amount"
              />
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((a) => {
                const active = String(a) === amountInput;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmountInput(String(a))}
                    className={"h-9 rounded-xl border px-3 text-[12px] font-bold transition active:scale-[0.97] " + (active ? "border-[#1877F2] bg-[#1877F2] text-white" : "border-[#E2E8F0] bg-white text-[#0F172A]")}
                  >
                    ₦{a.toLocaleString("en-NG")}
                  </button>
                );
              })}
            </div>

            <input
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none"
              placeholder="Reason (optional) — e.g. bank transfer confirmed"
            />

            <button
              type="button"
              onClick={submitAdjust}
              disabled={busy || !amountInput}
              className={"mt-3 flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60 " + (mode === "credit" ? "bg-[#16A34A] shadow-[0_8px_20px_rgba(22,163,74,0.35)]" : "bg-red-500 shadow-[0_8px_20px_rgba(239,68,68,0.3)]")}
              style={{ height: 52 }}
            >
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" strokeWidth={2.5} />
                  Working…
                </>
              ) : (
                <>
                  {mode === "credit" ? "Credit" : "Debit"}
                  {amountInput ? " · ₦" + Number(amountInput).toLocaleString("en-NG") : ""}
                </>
              )}
            </button>

            {flash && (
              <p className={"mt-3 rounded-xl px-3 py-2.5 text-center text-[13px] font-semibold " + (flash.ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                {flash.text}
              </p>
            )}
          </section>

          <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <span className="text-[13px] font-bold text-[#0F172A]">Phone number</span>
            <p className="mt-1 text-[12px] text-[#64748B]">Fix a wrong or missing phone number on this account.</p>
            <div className="mt-3 flex gap-2">
              <input
                value={phoneDraft}
                onChange={(e) => setPhoneDraft(e.target.value.replace(/[^0-9+ ]/g, "").slice(0, 20))}
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none"
                placeholder="Phone number"
              />
              <button
                type="button"
                onClick={submitPhone}
                disabled={phoneBusy || phoneDraft.trim() === open.phone}
                className="h-11 shrink-0 rounded-xl bg-[#0B1220] px-4 text-[12px] font-bold text-white disabled:opacity-50 active:scale-[0.97]"
              >
                {phoneBusy ? "Saving…" : "Save"}
              </button>
            </div>
          </section>

          <section className="rounded-[20px] border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <span className="text-[13px] font-bold text-[#0F172A]">Recent transactions</span>
            {txnsLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1877F2] border-t-transparent" />
              </div>
            ) : txns.length === 0 ? (
              <p className="mt-3 text-[12px] text-slate-400">No transactions recorded for this user yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {txns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-slate-800">{t.label}</p>
                      <p className="text-[10.5px] text-slate-400">{when(t.createdAt)}</p>
                    </div>
                    <p className={"shrink-0 text-[13px] font-extrabold tabular-nums " + (t.amount < 0 ? "text-red-500" : "text-emerald-600")}>
                      {t.amount < 0 ? "−" : "+"}₦{Math.abs(t.amount).toLocaleString("en-NG")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] pb-16">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-2.5 px-4">
          <AdminMenuButton onClick={() => setMenuOpen(true)} />
          <div className="min-w-0">
            <h1 className="text-[16px] font-extrabold tracking-tight text-[#0F172A]">Users</h1>
            <p className="text-[11px] font-semibold text-[#64748B] truncate">Accounts, wallets and manual credits</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-bold text-[#1877F2] tabular-nums">
            {users.length}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-3 px-4 pt-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#1877F2] focus:outline-none"
            placeholder="Search name, email, phone or referral code"
          />
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#94A3B8]">Total customer wallets</span>
            <span className="text-[14px] font-extrabold tabular-nums text-[#0F172A]">{naira(totalBalances)}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1877F2] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              {search ? <SearchX size={22} /> : <UserRound size={22} />}
            </span>
            <p className="mt-3 text-[13px] font-semibold text-slate-500">
              {search ? "No users match that search" : "No users yet"}
            </p>
          </div>
        ) : (
          filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => openUser(u)}
              className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[13px] font-extrabold text-[#1877F2]">
                {initials(u.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-slate-900">
                  {u.fullName}
                  {u.isAdmin && (
                    <span className="ml-2 rounded-full bg-[#0B1220] px-2 py-0.5 text-[9px] font-bold text-white">ADMIN</span>
                  )}
                </p>
                <p className="truncate text-[12px] text-slate-400">{u.email || u.phone || u.id.slice(0, 8)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[14px] font-extrabold tabular-nums text-[#0F172A]">{naira(u.balance)}</p>
                <p className="text-[10.5px] text-slate-400">{when(u.createdAt)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}