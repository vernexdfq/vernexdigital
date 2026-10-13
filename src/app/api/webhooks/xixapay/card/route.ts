import { NextResponse } from "next/server";

/** Placeholder card webhook — credit logic can be added when cards go live. */
export async function POST() {
  return NextResponse.json({ ok: true, received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "xixapay-card-webhook" });
}
