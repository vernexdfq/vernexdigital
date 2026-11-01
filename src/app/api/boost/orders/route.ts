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

/** Map txn + provider status into UI buckets matching JAP */
export function normalizeStatus(rawStatus: string, providerStatus: string): string {
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

export function isJapId(id: string): boolean {
  return /^\d{6,}$/.test(String(id || "").trim());
}

/** Prefer numeric JAP order id over child refs like boost-xxx */
export function extractJapOrderId(meta: Record<string, unknown>, title?: string): string {
  const candidates = [
    meta.providerOrderId,
    meta.provider_order_id,
    meta.orderId,
    meta.order_id,
    meta.japOrderId,
    meta.jap_id,
  ];
  for (const c of candidates) {
    const s = String(c || "").trim();
    if (isJapId(s)) return s;
  }
  // Title patterns: "Boost #1032396838" or "#1032396838 — ..."
  const fromTitle = String(title || "").match(/#(\d{6,})/);
  if (fromTitle) return fromTitle[1];
  const ref = String(meta.ref || "").trim();
  if (isJapId(ref)) return ref;
  return "";
}

export function toTxnStatus(mapped: string): string {
  if (mapped === "completed") return "completed";
  if (mapped === "failed" || mapped === "cancelled") return mapped;
  if (mapped === "pending") return "pending";
  return "processing";
}

/**
 * GET /api/boost/orders
 * Live-syncs open orders from Verxor → JustAnotherPanel so badges show
 * Pending / In progress / Completed like the provider panel.
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
      .select("id, title, amount, status, meta, created_at, kind")
      .eq("user_id", user.id)
      .in("kind", ["boost", "boost_order"])
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
      meta: Record<string, unknown> | null;
      created_at: string;
      kind?: string;
    };

    const rows = (data || []) as Row[];

    if (verxorConfig().configured) {
      const open = rows
        .map((t) => {
          const meta = (t.meta as Record<string, unknown>) || {};
          const oid = extractJapOrderId(meta, t.title);
          return { t, oid, meta };
        })
        .filter(({ t, oid, meta }) => {
          const queryId = oid || String(meta.ref || "").trim();
          if (!queryId) return false;
          const st = String(t.status || "").toLowerCase();
          return !["completed", "failed", "cancelled", "canceled", "refunded"].includes(st);
        })
        .slice(0, 25);

      await Promise.all(
        open.map(async ({ t, oid, meta }) => {
          try {
            const queryParam = oid || String(meta.ref || "").trim();
            const res = await verxorFetch(
              `/boost/status?orderId=${encodeURIComponent(queryParam)}`,
            );
            const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
            if (!res.ok || body.ok === false) {
              console.warn("[boost/orders] status upstream", queryParam, body.error || res.status);
              return;
            }
            const japStatus = String(body.status || "");
            const mapped = normalizeStatus(String(t.status || ""), japStatus);

            // Resolve any newly returned numeric JAP ID
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
              charge: body.charge != null ? body.charge : meta.charge,
              startCount: body.startCount != null ? body.startCount : meta.startCount,
              reconciledAt: new Date().toISOString(),
            };
            const txnStatus = toTxnStatus(mapped);
            const patchObj: Record<string, unknown> = { status: txnStatus, meta: nextMeta };
            if (effectiveJap && (!t.title || !t.title.includes(effectiveJap))) {
              const svc = String(meta.serviceTitle || "Boost");
              patchObj.title = `Boost #${effectiveJap} — ${svc}`;
            }

            await admin
              .from("transactions")
              .update(patchObj)
              .eq("id", t.id);
            t.status = txnStatus;
            t.meta = nextMeta;
            if (patchObj.title) t.title = String(patchObj.title);
          } catch (e) {
            console.warn("[boost/orders] status sync failed", oid || meta.ref, e);
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
      const japId = extractJapOrderId(meta, t.title);

      return {
        id: japId || String(meta.providerOrderId || meta.orderId || meta.ref || t.id),
        txnId: t.id,
        ref: String(meta.ref || ""),
        providerOrderId: japId || undefined,
        service: String(
          meta.serviceTitle ||
            String(t.title || "").replace(/^Boost\s*[-—:#]?\s*\d*\s*[-—]?\s*/i, "") ||
            "Boost",
        ),
        platform: String(meta.platform || ""),
        platformName: String(meta.platformName || ""),
        link: String(meta.link || ""),
        qty: Number(meta.quantity) || Number(meta.qty) || 0,
        quantity: Number(meta.quantity) || Number(meta.qty) || 0,
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
