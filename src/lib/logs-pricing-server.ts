import { createServerClient } from "@/lib/supabase/server";
import { LOGS_RETAIL_DEFAULT } from "@/lib/logs-pricing";

export type LogsPricingConfig = {
  retail?: number[];
};

export type SharedLogsPricing = {
  retail: number[];
  persisted: boolean;
};

function normalizeRetail(value: LogsPricingConfig | null | undefined): number[] | null {
  if (!value || !Array.isArray(value.retail)) return null;
  const out: number[] = [];
  for (let i = 0; i < 3; i += 1) {
    const m = Number(value.retail[i]);
    if (!Number.isFinite(m) || m < 1 || m > 20) return null;
    out.push(m);
  }
  return out;
}

/**
 * Admin-editable Buy Logs retail multipliers, stored in
 * site_settings.logs_pricing (jsonb). Falls back to the defaults
 * (×2.0 / ×1.6 / ×1.22 by wholesale USD tier) when nothing is saved
 * or the logs_pricing column has not been migrated.
 */
export async function getSharedLogsPricing(): Promise<SharedLogsPricing> {
  try {
    const db = createServerClient();
    const { data, error } = await db
      .from("site_settings")
      .select("logs_pricing")
      .eq("id", 1)
      .maybeSingle();
    if (error) return { retail: [...LOGS_RETAIL_DEFAULT], persisted: false };
    const retail = normalizeRetail(data?.logs_pricing as LogsPricingConfig | null);
    if (retail) return { retail, persisted: true };
    return { retail: [...LOGS_RETAIL_DEFAULT], persisted: false };
  } catch {
    return { retail: [...LOGS_RETAIL_DEFAULT], persisted: false };
  }
}
