"use client";

import { createBrowserClient } from "@/lib/supabase/client";

/**
 * Returns a usable access token for API calls.
 *
 * getSession() alone can return an expired JWT from localStorage.
 * We validate with getUser() (contacts Auth) and refresh when needed
 * so "already signed in" users are not told the session expired.
 */
export async function getValidAccessToken(): Promise<{
  token: string | null;
  error?: string;
}> {
  const supabase = createBrowserClient();

  try {
    // Validates JWT with Supabase; may refresh under the hood
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (!userError && userData.user) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.access_token) {
        return { token: sessionData.session.access_token };
      }
    }

    // Explicit refresh when getUser failed or session missing token
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession();

    if (!refreshError && refreshed.session?.access_token) {
      return { token: refreshed.session.access_token };
    }

    const message =
      userError?.message ||
      refreshError?.message ||
      "Your session has expired. Please sign in again.";

    return { token: null, error: message };
  } catch (e) {
    return {
      token: null,
      error:
        e instanceof Error
          ? e.message
          : "Your session has expired. Please sign in again.",
    };
  }
}
