import { createServerClient } from "@/lib/supabase/server";
import { BOOST_DEFAULT_MARKUP, boostMarkupFromEnv } from "@/lib/boost-pricing";

export type BoostPricingConfig = { markup: number };

/**
 * Admin-editable boost markup, stored in site_settings.boost_pricing (jsonb).
 * Falls back to BOOST_PANEL_MARKUP env / 25% default when not saved yet
 * or when the boost_pricing column has not been migrated.
 */
export async function getSharedBoostPricing(): Promise<{
  markup: number;
  persisted: boolean;
}> {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("site_settings")
      .select("boost_pricing")
      .eq("id", 1)
      .maybeSingle();
    if (error) return { markup: boostMarkupFromEnv(), persisted: false };
    const value = data?.boost_pricing as BoostPricingConfig | null;
    const markup = Number(value?.markup);
    if (Number.isFinite(markup) && markup >= 0 && markup <= 5) {
      return { markup, persisted: true };
    }
    return { markup: boostMarkupFromEnv(), persisted: false };
  } catch {
    return { markup: boostMarkupFromEnv(), persisted: false };
  }
}
