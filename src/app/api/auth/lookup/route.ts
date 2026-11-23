import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone")?.replace(/\D/g, "") || "";
    const email = searchParams.get("email")?.trim().toLowerCase() || "";

    if (!phone && !email) {
      return NextResponse.json({ error: "Phone or email parameter required" }, { status: 400 });
    }

    const supabase = createServerClient();
    let query = supabase.from("profiles").select("id, email, phone, full_name");

    if (phone) {
      // Clean phone: last 10 or 11 digits
      const phoneDigits = phone.slice(-11);
      query = query.or(`phone.eq.${phoneDigits},phone.eq.0${phoneDigits.slice(-10)},phone.eq.234${phoneDigits.slice(-10)}`);
    } else if (email) {
      query = query.eq("email", email);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error || !data) {
      return NextResponse.json({ ok: false, error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      email: data.email,
      phone: data.phone,
      fullName: data.full_name,
    });
  } catch (err) {
    console.error("auth/lookup error", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
