"use client";

import { createBrowserClient } from "@/lib/supabase/client";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  referralCode: string;
  isAdmin: boolean;
  createdAt: string | null;
  balance: number;
};

export type AdminTxn = {
  id: string;
  label: string;
  amount: number;
  createdAt: string | null;
};

function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  const s = String(v).trim();
  return s || fallback;
}

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const supabase = createBrowserClient();
  const [profilesRes, walletsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, referral_code, created_at, is_admin")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("wallets").select("user_id, balance").limit(500),
  ]);

  const balances = new Map<string, number>();
  for (const w of walletsRes.data ?? []) {
    if (w?.user_id) balances.set(String(w.user_id), Number(w.balance ?? 0));
  }

  const users: AdminUser[] = (profilesRes.data ?? []).map((r: Record<string, unknown>) => ({
    id: str(r.id),
    fullName: str(r.full_name, "User"),
    email: str(r.email),
    phone: str(r.phone),
    referralCode: str(r.referral_code),
    isAdmin: Boolean(r.is_admin),
    createdAt: (r.created_at as string) ?? null,
    balance: balances.get(str(r.id)) ?? 0,
  }));

  return users;
}

export async function adjustUserWallet(
  userId: string,
  signedAmount: number,
  note: string,
): Promise<number> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc("admin_adjust_wallet", {
    p_target_user: userId,
    p_amount: signedAmount,
    p_note: note,
  });
  if (error) throw new Error(error.message);
  const balance = Number(data);
  if (!Number.isFinite(balance)) throw new Error("Wallet updated but the new balance could not be read.");
  return balance;
}

export async function saveUserPhone(userId: string, phone: string): Promise<void> {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from("profiles")
    .update({ phone })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function fetchUserTransactions(userId: string): Promise<AdminTxn[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, kind, title, amount, status, meta, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).map((t: Record<string, unknown>, i: number) => ({
    id: str(t.id, String(i)),
    label: str(t.title) || str(t.kind) || "Transaction",
    amount: Number(t.amount ?? 0),
    createdAt: (t.created_at as string) ?? null,
  }));
}