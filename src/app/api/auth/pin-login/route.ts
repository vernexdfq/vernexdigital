import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyPin } from "@/lib/pin";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const pin = String(body.pin || "").replace(/\D/g, "").slice(0, 4);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter your email" }, { status: 400 });
    }
    if (pin.length !== 4) {
      return NextResponse.json({ error: "Enter your 4-digit PIN" }, { status: 400 });
    }

    const admin = adminClient();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, email, pin_hash, full_name")
      .eq("email", email)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Invalid email or PIN" }, { status: 401 });
    }

    if (!profile.pin_hash || !verifyPin(pin, email, profile.pin_hash)) {
      return NextResponse.json({ error: "Invalid email or PIN" }, { status: 401 });
    }

    // Issue a magic-link style token the client can exchange for a session
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData) {
      console.error(linkError);
      return NextResponse.json({ error: "Could not start session" }, { status: 500 });
    }

    const tokenHash =
      linkData.properties?.hashed_token ||
      (linkData as { properties?: { hashed_token?: string } }).properties?.hashed_token;

    if (!tokenHash) {
      return NextResponse.json({ error: "Could not start session" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      email,
      token_hash: tokenHash,
      full_name: profile.full_name,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
