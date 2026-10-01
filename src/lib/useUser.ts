"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  referral_code: string;
  created_at: string | null;
};

export type UserWallet = {
  balance: number;
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMemberSince(iso: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export function useUser() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<UserWallet>({ balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setProfile(null);
        setWallet({ balance: 0 });
        setError(authError?.message || "Not signed in");
        return;
      }

      const user = authData.user;
      const meta = user.user_metadata || {};

      const { data: row } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, referral_code, created_at")
        .eq("id", user.id)
        .maybeSingle();

      const fullName =
        (row?.full_name && String(row.full_name).trim()) ||
        (meta.full_name && String(meta.full_name).trim()) ||
        (user.email ? user.email.split("@")[0] : "User");

      const email = row?.email || user.email || "";
      const phone =
        (row?.phone && String(row.phone)) ||
        (meta.phone && String(meta.phone)) ||
        "";
      const referral =
        (row?.referral_code && String(row.referral_code)) ||
        user.id.replace(/-/g, "").slice(0, 8).toUpperCase();

      setProfile({
        id: user.id,
        full_name: fullName,
        email,
        phone,
        referral_code: referral,
        created_at: row?.created_at || user.created_at || null,
      });

      const { data: w } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      setWallet({
        balance: w?.balance != null ? Number(w.balance) : 0,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
      setProfile(null);
      setWallet({ balance: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    profile,
    wallet,
    loading,
    error,
    refresh,
    initials: profile ? initialsFromName(profile.full_name) : "?",
    memberSince: profile ? formatMemberSince(profile.created_at) : "",
  };
}
