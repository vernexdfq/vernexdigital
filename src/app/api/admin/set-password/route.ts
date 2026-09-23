import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Body: { email, password, access_token? }
 * - If the caller is already an admin, updates their password.
 * - If no admin exists yet, creates/promotes this email as the first admin.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email.includes("@")) {
      return NextResponse.json({ error: "Valid admin email required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const admin = adminClient();

    // Optional: verify caller is already admin via bearer token
    const authHeader = req.headers.get("authorization");
    let callerIsAdmin = false;
    let callerId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const {
        data: { user },
      } = await admin.auth.getUser(token);
      if (user) {
        callerId = user.id;
        const { data: profile } = await admin
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();
        callerIsAdmin = !!profile?.is_admin;
      }
    }

    // Count existing admins
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true);

    const hasAdmins = (count || 0) > 0;

    // Only allow bootstrap (no admins yet) or existing admin
    if (hasAdmins && !callerIsAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Find or create user by email
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 200 });
    let user = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (!user) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Admin", is_admin_bootstrap: true },
      });
      if (createError || !created.user) {
        return NextResponse.json(
          { error: createError?.message || "Could not create admin user" },
          { status: 400 }
        );
      }
      user = created.user;
    } else {
      const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
        password,
        email_confirm: true,
      });
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    }

    // Promote to admin on profiles
    await admin.from("profiles").upsert(
      {
        id: user.id,
        email,
        full_name: user.user_metadata?.full_name || "Admin",
        is_admin: true,
      },
      { onConflict: "id" }
    );

    // Store admin email in site_settings for reference
    await admin
      .from("site_settings")
      .upsert(
        {
          id: 1,
          admin_email: email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    return NextResponse.json({
      ok: true,
      message: "Admin password saved. Use this email and password on /admin/login",
      email,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to set admin password" }, { status: 500 });
  }
}
