import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashPin } from "@/lib/pin";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function anonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").replace(/\D/g, "").slice(0, 11);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const pin = String(body.pin || "").replace(/\D/g, "").slice(0, 4);
    const referral = String(body.referral || "").trim() || null;

    if (!fullName || fullName.length < 2) {
      return NextResponse.json({ error: "Enter your full name" }, { status: 400 });
    }
    if (phone.length !== 11) {
      return NextResponse.json({ error: "Phone must be 11 digits" }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (pin.length !== 4) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    const supabase = anonClient();

    // Sign up — email confirmation should be OFF in Supabase Auth settings
    const { data: signData, error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          referral_code: referral,
        },
      },
    });

    if (signError) {
      return NextResponse.json({ error: signError.message }, { status: 400 });
    }

    const user = signData.user;
    if (!user) {
      return NextResponse.json({ error: "Could not create user" }, { status: 500 });
    }

    const pin_hash = hashPin(pin, email);
    const referral_code =
      referral ||
      user.id.replace(/-/g, "").slice(0, 8).toUpperCase();

    const admin = adminClient();

    // Upsert profile (trigger may have already created a row)
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName,
        email,
        phone,
        pin_hash,
        referral_code,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("profile upsert", profileError);
      // still return session if we have one — profile can be fixed later
    }

    // Ensure wallet row exists
    await admin.from("wallets").upsert(
      { user_id: user.id, balance: 0 },
      { onConflict: "user_id" }
    );

    return NextResponse.json({
      ok: true,
      session: signData.session,
      user: {
        id: user.id,
        email: user.email,
        full_name: fullName,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
