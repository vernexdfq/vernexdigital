import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({ hasAdmins: false, configured: false });
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true);

    return NextResponse.json({
      hasAdmins: (count || 0) > 0,
      configured: true,
    });
  } catch {
    return NextResponse.json({ hasAdmins: false, configured: false });
  }
}
