import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/cashback/claim
 *
 * Moves ALL earned, unclaimed cashback into the panel wallet
 * (partner_wallets) — exactly like a top-up, so the panel's customers
 * can spend it right away.
 *
 * Safety: each transaction is stamped with meta.cashbackClaimedAt at
 * the moment it is claimed, guarded so a transaction can only ever be
 * claimed once (double clicks or two admins cannot double-credit).
 */

const PANEL_SLUG = "vernexdigital";

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (!url || !anon) {
      return NextResponse.json(
        { ok: false, error: "Supabase not configured" },
        { status: 503 },
      );
    }
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Sign in as admin." },
        { status: 401 },
      );
    }

    const client = createClient(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data } = await client.auth.getUser();
    if (!data.user) {
      return NextResponse.json(
        { ok: false, error: "Sign in as admin." },
        { status: 401 },
      );
    }

    const admin = createServerClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!profile?.is_admin) {
      return NextResponse.json({ ok: false, error: "Admins only." }, { status: 403 });
    }

    // 1. Find completed orders with unclaimed cashback.
    const { data: txns, error: txErr } = await admin
      .from("transactions")
      .select("id, kind, amount, status, meta")
      .in("status", ["completed", "success"])
      .order("created_at", { ascending: false })
      .limit(20000);
    if (txErr) {
      return NextResponse.json({ ok: false, error: txErr.message }, { status: 500 });
    }

    const now = new Date().toISOString();
    let credited = 0;
    let claimedOrders = 0;

    // 2. Claim each row atomically. The guard (.is on meta->>cashbackClaimedAt)
    //    means only rows THIS call actually claimed are returned — anything
    //    already claimed by someone else returns nothing and is not counted.
    for (const t of (txns ?? []) as Array<Record<string, unknown>>) {
      const meta = (t.meta && typeof t.meta === "object" ? t.meta : {}) as Record<string, unknown>;
      if (meta.cashbackClaimedAt) continue;
      const panelCharge = Number(meta.panelCharge);
      if (!Number.isFinite(panelCharge) || panelCharge <= 0) continue;
      const face = Math.abs(Number(t.amount) || 0);
      if (face <= 0) continue;

      const cash = Math.max(0, Math.round((face - panelCharge) * 100) / 100);
      if (cash <= 0) continue;

      const { data: updated } = await admin
        .from("transactions")
        .update({ meta: { ...meta, cashbackClaimedAt: now } })
        .eq("id", t.id)
        .is("meta->>cashbackClaimedAt", "null")
        .select("id");

      if (updated && updated.length > 0) {
        credited = Math.round((credited + cash) * 100) / 100;
        claimedOrders += 1;
      }
    }

    if (credited <= 0) {
      const { data: wallet } = await admin
        .from("partner_wallets")
        .select("balance")
        .eq("panel_slug", PANEL_SLUG)
        .maybeSingle();
      return NextResponse.json({
        ok: true,
        credited: 0,
        orders: 0,
        balance: wallet?.balance != null ? Number(wallet.balance) : 0,
        message: "No unclaimed cashback right now.",
      });
    }

    // 3. Credit the panel wallet (same wallet bank transfers go into).
    const { data: wallet } = await admin
      .from("partner_wallets")
      .select("balance")
      .eq("panel_slug", PANEL_SLUG)
      .maybeSingle();

    const current = wallet?.balance != null ? Number(wallet.balance) : 0;
    const next = Math.round((current + credited) * 100) / 100;

    await admin.from("partner_wallets").upsert(
      {
        panel_slug: PANEL_SLUG,
        balance: next,
        currency: "NGN",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "panel_slug" },
    );

    // 4. Audit record so the movement shows in history.
    await admin.from("transactions").insert({
      kind: "cashback_claim",
      status: "success",
      amount: credited,
      meta: {
        cashbackClaim: true,
        ordersClaimed: claimedOrders,
        creditedTo: "panel_wallet",
        claimedAt: now,
      },
    });

    return NextResponse.json({
      ok: true,
      credited,
      orders: claimedOrders,
      balance: next,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Could not move cashback to wallet." },
      { status: 500 },
    );
  }
}
