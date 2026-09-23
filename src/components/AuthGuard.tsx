"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Wraps app screens that require a logged-in user.
 * Redirects to /login when there is no Supabase session.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setReady(true);
    }

    check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#1877F2] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
