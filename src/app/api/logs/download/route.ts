import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createLogsDownloadToken, buildLogsCredentialsFileText } from "@/lib/logs-download";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("id") || req.nextUrl.searchParams.get("orderId") || "").trim();
    const token = (req.nextUrl.searchParams.get("token") || "").trim();

    if (!id) {
      return new NextResponse("Order ID is required", { status: 400 });
    }

    const expectedToken = createLogsDownloadToken(id);
    const tokenValid = token && token === expectedToken;

    let authorized = Boolean(tokenValid);

    if (!authorized) {
      const auth = req.headers.get("authorization") || "";
      const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
      if (bearer) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (url && anon) {
          const client = createClient(url, anon, {
            global: { headers: { Authorization: `Bearer ${bearer}` } },
            auth: { autoRefreshToken: false, persistSession: false },
          });
          const { data } = await client.auth.getUser();
          if (data?.user?.id) authorized = true;
        }
      }
    }

    if (!authorized) {
      return new NextResponse("Unauthorized: Invalid or expired download link", { status: 401 });
    }

    const admin = createServerClient();
    const { data: order, error } = await admin
      .from("logs_orders")
      .select("id, platform, title, quantity, credentials, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error || !order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const platform = String(order.platform || "Accounts");
    const title = String(order.title || "Delivered Accounts");
    const quantity = Number(order.quantity) || 1;
    const credentials = Array.isArray(order.credentials) ? order.credentials.map(String) : [];

    const fileContent = buildLogsCredentialsFileText({
      id,
      platform,
      title,
      quantity,
      credentials,
      createdAt: order.created_at ? String(order.created_at) : undefined,
    });

    const safePlatform = platform.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filename = `vernex-${safePlatform}-order-${id.slice(0, 8)}.txt`;

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Download failed";
    return new NextResponse(`Download error: ${message}`, { status: 500 });
  }
}
