"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Protects /admin/* (except /admin/login).
 * Accepts: Supabase is_admin user OR partner env session cookie.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin/login")) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const statusRes = await fetch("/api/admin/status", {
          credentials: "include",
          cache: "no-store",
        });
        const status = await statusRes.json();

        if (cancelled) return;

        // Partner env session cookie is enough
        if (status.partnerSession) {
          try {
            sessionStorage.setItem("vernex_admin", "1");
          } catch {}
          setReady(true);
          return;
        }

        // First-time setup: no admin and no partner env → allow
        if (!status.hasAdmins && !status.partnerEnvConfigured) {
          setReady(true);
          return;
        }

        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        if (!data.session?.user) {
          router.replace("/admin/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", data.session.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (!profile?.is_admin) {
          await supabase.auth.signOut();
          router.replace("/admin/login");
          return;
        }

        setReady(true);
      } catch {
        if (!cancelled) router.replace("/admin/login");
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1877F2] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
