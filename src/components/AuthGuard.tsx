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
 * Redirects to /login when there is no Supabase session.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // If we already confirmed auth this session, render immediately.
  const [ready, setReady] = useState(cachedAuthed === true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!data.session) {
        cachedAuthed = false;
        router.replace("/login");
        return;
      }

      cachedAuthed = true;
      setReady(true);
    }

    // Always re-validate, but only show spinner when we have no cache yet.
    if (cachedAuthed !== true) {
      check();
    } else {
      // Background re-check without blocking UI
      check();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        cachedAuthed = false;
        router.replace("/login");
      } else {
        cachedAuthed = true;
        setReady(true);
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
