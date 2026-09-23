"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Protects /admin/* (except /admin/login).
 * Requires a logged-in user with profiles.is_admin = true.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Login page is public
    if (pathname?.startsWith("/admin/login")) {
      setReady(true);
      return;
    }

    let cancelled = false;
    const supabase = createBrowserClient();

    async function check() {
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
    }

    check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !pathname?.startsWith("/admin/login")) {
        router.replace("/admin/login");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
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
