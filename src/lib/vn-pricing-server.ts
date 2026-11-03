import { createServerClient } from "@/lib/supabase/server";
import { VN_DEFAULT_PRICING, type VnPricingConfig } from "@/lib/vn-panel-pricing";

export async function getSharedVnPricingState(): Promise<{ config: VnPricingConfig; ready: boolean }> {
  try {
    const db = createServerClient();
    const { data, error } = await db.from("site_settings").select("virtual_number_pricing").eq("id", 1).maybeSingle();
    if (error) return { config: VN_DEFAULT_PRICING, ready: false };
    const value = data?.virtual_number_pricing as VnPricingConfig | null;
    return { config: value?.tiers ? value : VN_DEFAULT_PRICING, ready: true };
  } catch {
    return { config: VN_DEFAULT_PRICING, ready: false };
  }
}

export async function getSharedVnPricing(): Promise<VnPricingConfig> {
  return (await getSharedVnPricingState()).config;
}
