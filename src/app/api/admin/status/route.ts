import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  PARTNER_ADMIN_COOKIE,
  verifyPartnerAdminToken,
  partnerAdminEmails,
} from "@/lib/partner-admin";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(PARTNER_ADMIN_COOKIE)?.value;
  const partner = token ? verifyPartnerAdminToken(token) : { ok: false as const };
  const partnerEnvConfigured =
    partnerAdminEmails().length > 0 &&
    Boolean(process.env.PARTNER_ADMIN_PASSWORD && process.env.PARTNER_ADMIN_PASSWORD.length >= 8);

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json({
        hasAdmins: partnerEnvConfigured,
        configured: false,
        partnerEnvConfigured,
        partnerSession: partner.ok,
        partnerEmail: partner.ok ? partner.email : null,
      });
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true);

    return NextResponse.json({
      hasAdmins: (count || 0) > 0 || partnerEnvConfigured,
      configured: true,
      partnerEnvConfigured,
      partnerSession: partner.ok,
      partnerEmail: partner.ok ? partner.email : null,
    });
  } catch {
    return NextResponse.json({
      hasAdmins: partnerEnvConfigured,
      configured: false,
      partnerEnvConfigured,
      partnerSession: partner.ok,
      partnerEmail: partner.ok ? partner.email : null,
    });
  }
}
