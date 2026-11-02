import { NextResponse } from "next/server";
import { verxorConfig, verxorFetch } from "@/lib/verxor-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

/** Fallback catalog — mirrors Verxor /api/v1/tv packages exactly */
const FALLBACK = {
  dstv: [
    { id: "dstv-padi", name: "Padi", price: 4400, validityDays: 30 },
    { id: "dstv-yanga", name: "Yanga", price: 6000, validityDays: 30 },
    { id: "dstv-confam", name: "Confam", price: 11000, validityDays: 30 },
    { id: "dstv79", name: "Compact", price: 19000, validityDays: 30 },
    { id: "dstv7", name: "Compact Plus", price: 30000, validityDays: 30 },
    { id: "dstv3", name: "Premium", price: 44500, validityDays: 30 },
    { id: "dstv9", name: "Premium-French", price: 69000, validityDays: 30 },
    { id: "dstv10", name: "Premium-Asia", price: 50500, validityDays: 30 },
    { id: "padi-extra", name: "Padi + ExtraView", price: 10400, validityDays: 30 },
    { id: "yanga-extra", name: "Yanga + ExtraView", price: 12000, validityDays: 30 },
    { id: "confam-extra", name: "Confam + ExtraView", price: 17000, validityDays: 30 },
    { id: "dstv30", name: "Compact + Extra View", price: 25000, validityDays: 30 },
    { id: "dstv45", name: "Compact Plus + Extra View", price: 36000, validityDays: 30 },
    { id: "dstv33", name: "Premium + Extra View", price: 50500, validityDays: 30 },
    { id: "com-frenchtouch", name: "Compact + French Touch", price: 26000, validityDays: 30 },
    { id: "complus-frenchtouch", name: "Compact Plus + French Touch", price: 37000, validityDays: 30 },
    { id: "dstv-padi-showmax", name: "Padi + Showmax", price: 8900, validityDays: 30 },
    { id: "dstv-yanga-showmax", name: "Yanga + Showmax", price: 8250, validityDays: 30 },
    { id: "dstv-confam-showmax", name: "Confam + Showmax", price: 13250, validityDays: 30 },
    { id: "dstv-compact-showmax", name: "Compact + Showmax", price: 21250, validityDays: 30 },
    { id: "dstv-compact-plus-showmax", name: "Compact Plus + Showmax", price: 32250, validityDays: 30 },
    { id: "dstv-premium-showmax", name: "Premium + Showmax", price: 44500, validityDays: 30 },
    { id: "dstv-greatwall", name: "Great Wall Standalone", price: 3800, validityDays: 30 },
    { id: "dstv-indian", name: "Indian", price: 14900, validityDays: 30 },
    { id: "dstv-movie-bundle-add-on", name: "Movie Bundle Add-on", price: 3500, validityDays: 30 },
    { id: "frenchplus-addon", name: "French Plus Add-on", price: 24500, validityDays: 30 },
    { id: "frenchtouch-addon", name: "French Touch Add-on", price: 7000, validityDays: 30 },
  ],
  gotv: [
    { id: "gotv-smallie", name: "Smallie", price: 1900, validityDays: 30 },
    { id: "gotv-jinja", name: "Jinja", price: 3900, validityDays: 30 },
    { id: "gotv-jolli", name: "Jolli", price: 5800, validityDays: 30 },
    { id: "gotv-max", name: "Max", price: 8500, validityDays: 30 },
    { id: "gotv-supa", name: "Supa", price: 11400, validityDays: 30 },
    { id: "gotv-supa-plus", name: "Supa Plus", price: 16800, validityDays: 30 },
    { id: "gotv-smallie-3months", name: "Smallie (3 months)", price: 5100, validityDays: 90 },
    { id: "gotv-smallie-1year", name: "Smallie (1 year)", price: 15000, validityDays: 365 },
  ],
  startimes: [
    { id: "nova", name: "Nova (Dish)", price: 2100, validityDays: 30 },
    { id: "uni-2", name: "Nova (Antenna)", price: 2100, validityDays: 30 },
    { id: "basic", name: "Basic (Antenna)", price: 4000, validityDays: 30 },
    { id: "smart", name: "Basic (Dish)", price: 5100, validityDays: 30 },
    { id: "classic", name: "Classic (Antenna)", price: 6000, validityDays: 30 },
    { id: "special-monthly", name: "Classic (Dish)", price: 7400, validityDays: 30 },
    { id: "super", name: "Super (Dish)", price: 9800, validityDays: 30 },
    { id: "super-antenna-monthly", name: "Super (Antenna)", price: 9500, validityDays: 30 },
    { id: "global-monthly-dish", name: "Global (Dish)", price: 21000, validityDays: 30 },
    { id: "uni-1", name: "Chinese (Dish)", price: 21000, validityDays: 30 },
    { id: "nova-weekly", name: "Nova (Antenna) 1 Week", price: 700, validityDays: 7 },
    { id: "nova-dish-weekly", name: "Nova (Dish) 1 Week", price: 700, validityDays: 7 },
    { id: "basic-weekly", name: "Basic (Antenna) 1 Week", price: 1400, validityDays: 7 },
    { id: "smart-weekly", name: "Basic (Dish) 1 Week", price: 1700, validityDays: 7 },
    { id: "classic-weekly", name: "Classic (Antenna) 1 Week", price: 2000, validityDays: 7 },
    { id: "special-weekly", name: "Classic (Dish) 1 Week", price: 2300, validityDays: 7 },
    { id: "classic-weekly-dish", name: "Classic (Dish) 1 Week", price: 2500, validityDays: 7 },
    { id: "super-weekly", name: "Super (Dish) 1 Week", price: 3300, validityDays: 7 },
    { id: "super-antenna-weekly", name: "Super (Antenna) 1 Week", price: 3200, validityDays: 7 },
    { id: "global-weekly-dish", name: "Global (Dish) 1 Week", price: 7000, validityDays: 7 },
    { id: "shs-weekly-2800", name: "SHS Weekly ₦2,800", price: 2800, validityDays: 7 },
    { id: "shs-weekly-4620", name: "SHS Weekly ₦4,620", price: 4620, validityDays: 7 },
    { id: "shs-weekly-4900", name: "SHS Weekly ₦4,900", price: 4900, validityDays: 7 },
    { id: "shs-weekly-9100", name: "SHS Weekly ₦9,100", price: 9100, validityDays: 7 },
    { id: "shs-monthly-12000", name: "SHS Monthly ₦12,000", price: 12000, validityDays: 30 },
    { id: "shs-monthly-19800", name: "SHS Monthly ₦19,800", price: 19800, validityDays: 30 },
    { id: "shs-monthly-21000", name: "SHS Monthly ₦21,000", price: 21000, validityDays: 30 },
    { id: "shs-monthly-39000", name: "SHS Monthly ₦39,000", price: 39000, validityDays: 30 },
  ],
};

/**
 * GET /api/cable-tv/packages
 * Prefer live Verxor catalog; fall back to static mirror.
 */
export async function GET() {
  if (verxorConfig().configured) {
    try {
      const res = await verxorFetch("/tv", { method: "GET" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        packages?: Record<
          string,
          { id: string; name: string; price: number; validityDays?: number }[]
        >;
      };
      if (res.ok && data.ok && data.packages) {
        return NextResponse.json({
          ok: true,
          source: "verxor",
          packages: data.packages,
        });
      }
    } catch {
      /* fall through */
    }
  }
  return NextResponse.json({ ok: true, source: "fallback", packages: FALLBACK });
}
