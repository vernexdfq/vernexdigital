"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Protects /admin/*. A signed-in Supabase account with is_admin = true is
 * required on every visit — the database RLS policies rely on this session.
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
        const supabase = createBrowserClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;

        if (!data.user) {
          router.replace("/admin/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", data.user.id)
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
