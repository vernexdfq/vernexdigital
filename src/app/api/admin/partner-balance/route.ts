import { NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Panel wholesale balance from Verxor reseller_wallet (linked to panel key).
 */
export async function GET() {
  try {
    const { configured } = verxorConfig();
    if (!configured) {
      return NextResponse.json({
        balance: 0,
        panelSlug: "vernexdigital",
        live: false,
        message: "Set VERXOR_PANEL_API_KEY to load live balance",
      });
    }

    const res = await verxorFetch("/partner/balance");
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      return NextResponse.json({
        balance: 0,
        panelSlug: "vernexdigital",
        live: false,
        error: data.reason || data.error || "balance_unavailable",
      });
    }

    const balance = Number(data.balanceNgn ?? data.balance) || 0;
    return NextResponse.json({
      balance,
      panelSlug: "vernexdigital",
      live: true,
      panel: data.panel || null,
    });
  } catch {
    return NextResponse.json({
      balance: 0,
      panelSlug: "vernexdigital",
      live: false,
    });
  }
}
