import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUser(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user || null;
}

/**
 * Poll OTP status from Verxor; persist otp_code on vn_orders when received.
 */
export async function GET(req: NextRequest) {
  const { configured } = verxorConfig();
  if (!configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured" },
      { status: 503 },
    );
  }

  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const providerOrderId = (sp.get("providerOrderId") || "").trim();
  const provider = (sp.get("provider") || "grizzly").trim().toLowerCase();
  const orderId = (sp.get("orderId") || "").trim();

  if (!providerOrderId) {
    return NextResponse.json(
      { ok: false, error: "providerOrderId required" },
      { status: 400 },
    );
  }

  try {
    const qs = new URLSearchParams({ provider, providerOrderId });
    if (orderId) qs.set("orderId", orderId);

    const res = await verxorFetch(`/numbers/status?${qs.toString()}`, { method: "GET" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || "Status check failed" },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    const otp = data.otp ? String(data.otp) : null;
    const status = otp
      ? "received"
      : String(data.status || "waiting").toLowerCase();

    // Persist OTP / status for this user
    try {
      const admin = createServerClient();
      const patch: Record<string, unknown> = {
        status: status === "received" ? "received" : status,
        updated_at: new Date().toISOString(),
      };
      if (otp) patch.otp_code = otp;

      if (orderId) {
        await admin
          .from("vn_orders")
          .update(patch)
          .eq("id", orderId)
          .eq("user_id", user.id);
      } else {
        await admin
          .from("vn_orders")
          .update(patch)
          .eq("provider_order_id", providerOrderId)
          .eq("user_id", user.id);
      }
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({
      ok: true,
      status,
      otp,
      code: otp,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Status check failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
