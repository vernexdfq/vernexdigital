import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";
import { extractJapOrderId, isJapId, normalizeStatus, toTxnStatus } from "../orders/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const xCron = req.headers.get("x-cron-secret") || "";
  const querySecret = new URL(req.url).searchParams.get("secret") || "";
  const isVercelCron = Boolean(req.headers.get("x-vercel-cron"));

  if (cronSecret) {
    if (bearer === cronSecret || xCron === cronSecret || querySecret === cronSecret || isVercelCron) {
      return true;
    }
  }

  // Also check admin / internal key if set
  const adminSecret = process.env.ADMIN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (adminSecret && bearer === adminSecret) {
    return true;
  }

  // If no CRON_SECRET is configured, allow internal calls
  if (!cronSecret) return true;
  return false;
}

/**
 * GET/POST /api/boost/reconcile
 * Server-side reconciliation job for child panel:
 * Scans open boost transactions in the database, queries Verxor (JAP),
 * and updates them to Completed/Processing/Cancelled without relying on user refreshes.
 */
async function runReconcile(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { configured } = verxorConfig();
  if (!configured) {
    return NextResponse.json(
      { ok: false, error: "VERXOR_PANEL_API_KEY not configured on this panel." },
      { status: 503 },
    );
  }

  const startTime = Date.now();

  try {
    const admin = createServerClient();
    const { data, error } = await admin
      .from("transactions")
      .select("id, user_id, title, amount, status, meta, created_at, kind")
      .in("kind", ["boost", "boost_order"])
      .not("status", "in", '("completed","failed","cancelled","canceled","refunded","success","rejected")')
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    type Row = {
      id: string;
      user_id: string;
      title: string;
      amount: number;
      status: string;
      meta: Record<string, unknown> | null;
      created_at: string;
    };

    const rows = (data || []) as Row[];
    let updatedCount = 0;
    let completedCount = 0;
    let failedCount = 0;
    const errors: Array<{ id: string; error: string }> = [];

    // Filter candidate orders
    const openOrders = rows.filter((r) => {
      const meta = (r.meta || {}) as Record<string, unknown>;
      const queryId = extractJapOrderId(meta, r.title) || String(meta.ref || "").trim();
      return Boolean(queryId);
    });

    const batch = openOrders.slice(0, 25);

    await Promise.all(
      batch.map(async (row) => {
        const meta = (row.meta || {}) as Record<string, unknown>;
        const oid = extractJapOrderId(meta, row.title);
        const queryId = oid || String(meta.ref || "").trim();

        try {
          const res = await verxorFetch(`/boost/status?orderId=${encodeURIComponent(queryId)}`);
          const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;

          if (!res.ok || body.ok === false) {
            errors.push({ id: row.id, error: String(body.error || `HTTP ${res.status}`) });
            return;
          }

          const japStatus = String(body.status || "");
          const mapped = normalizeStatus(row.status, japStatus);
          const txnStatus = toTxnStatus(mapped);

          // Resolve numeric JAP ID if returned
          const resolvedJap = String(body.orderId || body.providerOrderId || "").trim();
          const effectiveJap = isJapId(resolvedJap) ? resolvedJap : oid;

          const nextMeta = {
            ...meta,
            providerOrderId: effectiveJap || meta.providerOrderId,
            orderId: effectiveJap || meta.orderId,
            japOrderId: effectiveJap || meta.japOrderId,
            providerStatus: mapped,
            japStatus,
            remains: body.remains != null ? body.remains : meta.remains,
            startCount: body.startCount != null ? body.startCount : meta.startCount,
            reconciledAt: new Date().toISOString(),
          };

          const patchObj: Record<string, unknown> = {
            status: txnStatus,
            meta: nextMeta,
          };

          if (effectiveJap && (!row.title || !row.title.includes(effectiveJap))) {
            const svc = String(meta.serviceTitle || "Boost");
            patchObj.title = `Boost #${effectiveJap} — ${svc}`;
          }

          const updateRes = await admin
            .from("transactions")
            .update(patchObj)
            .eq("id", row.id);

          if (!updateRes.error) {
            updatedCount += 1;
            if (txnStatus === "success") completedCount += 1;
            if (txnStatus === "rejected") failedCount += 1;
          } else {
            errors.push({ id: row.id, error: updateRes.error.message });
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Sync error";
          errors.push({ id: row.id, error: msg });
        }
      }),
    );

    return NextResponse.json({
      ok: true,
      scanned: rows.length,
      openCount: openOrders.length,
      processed: batch.length,
      updated: updatedCount,
      completed: completedCount,
      failed: failedCount,
      errors: errors.length ? errors : undefined,
      durationMs: Date.now() - startTime,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Reconciliation failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return runReconcile(req);
}

export async function POST(req: NextRequest) {
  return runReconcile(req);
}
