import { NextRequest, NextResponse } from "next/server";
import {
  isPartnerAdminEmail,
  checkPartnerAdminPassword,
  makePartnerAdminToken,
  PARTNER_ADMIN_COOKIE,
} from "@/lib/partner-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!isPartnerAdminEmail(email) || !checkPartnerAdminPassword(password)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = makePartnerAdminToken(email);
    const res = NextResponse.json({
      ok: true,
      email,
      mode: "partner_env",
    });
    res.cookies.set(PARTNER_ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PARTNER_ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
