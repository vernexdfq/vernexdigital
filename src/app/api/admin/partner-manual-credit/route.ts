import { NextRequest, NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY manual credit to Verxor reseller_wallet via panel API key.
 * Use only until OPay generate is stable.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const amount = Math.round(Number(body.amount));
    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json({ error: "Minimum is ₦100." }, { status: 400 });
    }
    if (amount > 2_000_000) {
      return NextResponse.json({ error: "Amount too large." }, { status: 400 });
    }

    const { configured } = verxorConfig();
    if (!configured) {
      return NextResponse.json(
        { error: "VERXOR_PANEL_API_KEY is not set." },
        { status: 503 },
      );
    }

    const res = await verxorFetch("/partner/fund/manual-credit", {
      method: "POST",
      body: JSON.stringify({
        amountNgn: amount,
        amount,
        note: body.note || "vernexdigital admin manual top-up",
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      return NextResponse.json(
        {
          error:
            data.message ||
            data.error ||
            `Manual credit failed (HTTP ${res.status})`,
        },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      credited: data.credited || amount,
      balance: data.balanceNgn ?? data.balance,
      message: data.message || "Credited.",
    });
  } catch (e) {
    console.error("[partner-manual-credit]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 },
    );
  }
}
