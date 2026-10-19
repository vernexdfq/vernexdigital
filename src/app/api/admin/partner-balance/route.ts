import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Panel wholesale balance. Returns 0 until partner_wallets SQL exists. */
export async function GET() {
  try {
    const admin = createServerClient();
    const { data, error } = await admin
      .from("partner_wallets")
      .select("balance")
      .eq("panel_slug", "vernexdigital")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ balance: 0, panelSlug: "vernexdigital" });
    }
    return NextResponse.json({
      balance: Number(data.balance) || 0,
      panelSlug: "vernexdigital",
    });
  } catch {
    return NextResponse.json({ balance: 0, panelSlug: "vernexdigital" });
  }
}
