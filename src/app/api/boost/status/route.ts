import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapJapStatus(raw: string): string {
  const s = String(raw || "").toLowerCase();
  if (s.includes("complete")) return "completed";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("fail") || s.includes("error") || s.includes("refund")) return "failed";
  if (s.includes("progress") || s.includes("processing")) return "processing";
  if (s.includes("pending") || s.includes("awaiting")) return "pending";
  return s || "pending";
}

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

export async function GET(req: NextRequest) {
  const { configured, base } = verxorConfig();
  const orderId = req.nextUrl.searchParams.get("orderId") || req.nextUrl.searchParams.get("id");
  if (!orderId) {
    return NextResponse.json({ ok: false, error: "orderId required" }, { status: 400 });
  }
  try {
    let res: Response;
    if (configured) {
      res = await verxorFetch(`/boost/status?orderId=${encodeURIComponent(orderId)}`);
    } else {
      res = await fetch(`${base}/boost/status?orderId=${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
    }
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        { ok: false, error: data.error || "Status check failed", orderId },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    const japStatus = String(data.status || "");
    const mapped = mapJapStatus(japStatus);

    try {
      const user = await getUser(req);
      if (user) {
        const admin = createServerClient();
        const { data: rows } = await admin
          .from("transactions")
          .select("id, meta, status")
          .eq("user_id", user.id)
          .eq("kind", "boost")
          .order("created_at", { ascending: false })
          .limit(40);

        const match = (rows || []).find((row) => {
          const meta = (row.meta as Record<string, unknown>) || {};
          return (
            String(meta.providerOrderId || "") === String(orderId) ||
            String(meta.ref || "") === String(orderId)
          );
        });

        if (match) {
          const meta = { ...((match.meta as Record<string, unknown>) || {}) };
          meta.providerStatus = mapped;
          meta.japStatus = japStatus;
          if (data.remains != null) meta.remains = data.remains;
          if (data.charge != null) meta.charge = data.charge;
          if (data.startCount != null) meta.startCount = data.startCount;

          const txnStatus =
            mapped === "completed"
              ? "completed"
              : mapped === "failed" || mapped === "cancelled"
                ? mapped
                : "processing";

          await admin
            .from("transactions")
            .update({ status: txnStatus, meta })
            .eq("id", match.id);
        }
      }
    } catch {
      /* non-fatal */
    }

    return NextResponse.json({
      ok: true,
      orderId,
      status: mapped,
      japStatus,
      charge: data.charge,
      startCount: data.startCount,
      remains: data.remains,
      currency: data.currency,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Status failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
