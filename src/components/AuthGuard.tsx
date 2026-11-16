"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Module-level session cache so navigating between Home / Services / Fund /
 * History / Profile does NOT re-show the full-page spinner every time.
 * Auth is still re-validated in the background; only the first mount (or a
 * true logout) triggers the loading UI.
 */
let cachedAuthed: boolean | null = null;

/**
 * Wraps app screens that require a logged-in user.
 * Redirects to /login only when there is no valid Supabase user
 * (after refresh attempt).
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(cachedAuthed === true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();

    async function check() {
      // getUser talks to Auth and refreshes expired access tokens when possible
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!userError && userData.user) {
        cachedAuthed = true;
        setReady(true);
        return;
      }

      // One explicit refresh before treating the user as logged out
      const { data: refreshed, error: refreshError } =
        await supabase.auth.refreshSession();

      if (cancelled) return;

      if (!refreshError && refreshed.session?.user) {
        cachedAuthed = true;
        setReady(true);
        return;
      }

      cachedAuthed = false;
      router.replace("/login");
    }

    void check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        cachedAuthed = false;
        router.replace("/login");
        return;
      }
      // TOKEN_REFRESHED / SIGNED_IN
      cachedAuthed = true;
      setReady(true);
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
