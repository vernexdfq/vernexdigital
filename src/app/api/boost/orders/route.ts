import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

/** Map txn + provider status into UI buckets matching JAP: pending / processing / completed */
function normalizeStatus(rawStatus: string, providerStatus: string): string {
  const raw = String(rawStatus || "").toLowerCase();
  const prov = String(providerStatus || "").toLowerCase();
  const blob = `${raw} ${prov}`;

  if (
    blob.includes("fail") ||
    blob.includes("error") ||
    raw === "refunded" ||
    prov.includes("refund")
  ) {
    return "failed";
  }
  if (blob.includes("cancel")) return "cancelled";
  if (blob.includes("complete") || blob.includes("success") || blob.includes("done")) {
    return "completed";
  }
  if (
    blob.includes("progress") ||
    blob.includes("processing") ||
    blob.includes("partial") ||
    blob.includes("running") ||
    blob.includes("queued")
  ) {
    return "processing";
  }
  if (raw === "pending" || prov === "pending" || !prov) return "pending";
  return "processing";
}

function isJapId(id: string): boolean {
  return /^\d+$/.test(String(id || "").trim());
}

/**
 * GET /api/boost/orders
 * Returns the user's boost orders and live-syncs status from Verxor → JustAnotherPanel
 * so badges show Pending / In progress / Completed like the provider panel.
 */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
  }

  try {
    const admin = createServerClient();
    const { data, error } = await admin
      .from("transactions")
      .select("id, title, amount, status, meta, created_at")
      .eq("user_id", user.id)
      .eq("kind", "boost")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    type Row = {
      id: string;
      title: string;
      amount: number;
      status: string;
      meta: Record<string, unknown>;
      created_at: string;
    };

    const rows = (data || []) as Row[];

    if (verxorConfig().configured) {
      const open = rows
        .map((t) => {
          const meta = (t.meta as Record<string, unknown>) || {};
          const oid = String(meta.providerOrderId || meta.ref || "").trim();
          return { t, oid, meta };
        })
        .filter(
          ({ t, oid }) =>
            isJapId(oid) &&
            !["completed", "failed", "cancelled", "canceled", "refunded"].includes(
              String(t.status || "").toLowerCase(),
            ),
        )
        .slice(0, 15);

      await Promise.all(
        open.map(async ({ t, oid, meta }) => {
          try {
            const res = await verxorFetch(`/boost/status?orderId=${encodeURIComponent(oid)}`);
            const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
            if (!res.ok || body.ok === false) return;
            const japStatus = String(body.status || "");
            const mapped = normalizeStatus(String(t.status || ""), japStatus);
            const nextMeta = {
              ...meta,
              providerStatus: mapped,
              japStatus,
              remains: body.remains != null ? body.remains : meta.remains,
              charge: body.charge != null ? body.charge : meta.charge,
              startCount: body.startCount != null ? body.startCount : meta.startCount,
            };
            const txnStatus =
              mapped === "completed"
                ? "completed"
                : mapped === "failed" || mapped === "cancelled"
                  ? mapped
                  : mapped === "pending"
                    ? "pending"
                    : "processing";
            await admin
              .from("transactions")
              .update({ status: txnStatus, meta: nextMeta })
              .eq("id", t.id);
            t.status = txnStatus;
            t.meta = nextMeta;
          } catch (e) {
            console.warn("[boost/orders] status sync failed", oid, e);
          }
        }),
      );
    }

    const orders = rows.map((t) => {
      const meta = (t.meta as Record<string, unknown>) || {};
      const amount = Math.abs(Number(t.amount) || 0);
      const rawStatus = String(t.status || "pending");
      const providerStatus = String(meta.providerStatus || meta.japStatus || "");
      const displayStatus = normalizeStatus(rawStatus, providerStatus);

      return {
        id: String(meta.providerOrderId || meta.ref || t.id),
        txnId: t.id,
        ref: String(meta.ref || ""),
        service: String(
          meta.serviceTitle || String(t.title || "").replace(/^Boost\s*[-—:]?\s*/i, "") || "Boost",
        ),
        platform: String(meta.platform || ""),
        platformName: String(meta.platformName || ""),
        link: String(meta.link || ""),
        qty: Number(meta.quantity) || 0,
        total: amount,
        ratePer1000: Number(meta.ratePer1000) || 0,
        status: displayStatus,
        rawStatus: t.status,
        providerStatus,
        japStatus: meta.japStatus != null ? String(meta.japStatus) : undefined,
        speed: String(meta.speed || ""),
        remains: meta.remains != null ? Number(meta.remains) : undefined,
        charge: meta.charge != null ? String(meta.charge) : undefined,
        startCount: meta.startCount != null ? String(meta.startCount) : undefined,
        createdAt: t.created_at,
      };
    });

    return NextResponse.json({ ok: true, orders, count: orders.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load boost orders";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
