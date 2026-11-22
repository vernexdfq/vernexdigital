import { createServerClient } from "@/lib/supabase/server";
import {
  RENT_SMS_DEFAULT_MULTIPLIERS,
  RENT_SMS_MULTIPLIER_COUNT,
  rentSmsNormalizeMultipliers,
} from "@/lib/rentsms-pricing";

export type RentSmsPricingConfig = {
  multipliers?: number[];
};

export type SharedRentSmsPricing = {
  multipliers: number[];
  persisted: boolean;
};

/**
 * Admin-editable Rent-for-SMS tier multipliers (5 slots, one per Verxor cost
 * tier), stored in site_settings.rent_sms_pricing (jsonb). Defaults are the
 * retail ÷ panel ratios, so nothing saved = sell at the same price as
 * verxor.com. Falls back to defaults when the column has not been migrated.
 */
export async function getSharedRentSmsPricing(): Promise<SharedRentSmsPricing> {
  const fallback = [...RENT_SMS_DEFAULT_MULTIPLIERS];
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("site_settings")
      .select("rent_sms_pricing")
      .eq("id", 1)
      .maybeSingle();
    if (error) return { multipliers: fallback, persisted: false };
    const cfg = (data?.rent_sms_pricing ?? null) as RentSmsPricingConfig | null;
    const normalized = rentSmsNormalizeMultipliers(cfg?.multipliers);
    if (normalized) return { multipliers: normalized, persisted: true };
    return { multipliers: fallback, persisted: false };
  } catch {
    return { multipliers: fallback, persisted: false };
  }
}

/** Number of multiplier slots (exported for the admin routes). */
export const RENT_SMS_SLOTS = RENT_SMS_MULTIPLIER_COUNT;
