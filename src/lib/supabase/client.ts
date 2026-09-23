import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Browser / client-side Supabase client (publishable key only).
 * Singleton so the session is shared across the app.
 */
export function createBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  browserClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
