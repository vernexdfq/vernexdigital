import { createServerClient } from "@/lib/supabase/server";
import { RENT_SMS_DEFAULT_MULTIPLIER } from "@/lib/rentsms-pricing";

export type RentSmsPricingConfig = {
  multiplier?: number;
};

export type SharedRentSmsPricing = {
  multiplier: number;
  persisted: boolean;
};

/**
 * Admin-editable Rent-for-SMS multiplier, stored in
 * site_settings.rent_sms_pricing (jsonb). Falls back to 1.0
 * (sell at the same price as Verxor retail) when nothing is saved
 * or the column has not been migrated yet.
 */
export async function getSharedRentSmsPricing(): Promise<SharedRentSmsPricing> {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("site_settings")
      .select("rent_sms_pricing")
      .eq("id", 1)
      .maybeSingle();
    if (error) return { multiplier: RENT_SMS_DEFAULT_MULTIPLIER, persisted: false };
    const cfg = (data?.rent_sms_pricing ?? null) as RentSmsPricingConfig | null;
    if (cfg && Number.isFinite(Number(cfg.multiplier)) && Number(cfg.multiplier) >= 1 && Number(cfg.multiplier) <= 5) {
      return { multiplier: Math.round(Number(cfg.multiplier) * 100) / 100, persisted: true };
    }
    return { multiplier: RENT_SMS_DEFAULT_MULTIPLIER, persisted: false };
  } catch {
    return { multiplier: RENT_SMS_DEFAULT_MULTIPLIER, persisted: false };
  }
}
