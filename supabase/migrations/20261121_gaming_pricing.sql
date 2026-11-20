-- ============================================================
-- Gaming top-up markup (admin-editable, shared across the panel)
-- Stored in site_settings so the Gaming pricing admin page can
-- update what customers pay without redeploying.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

alter table public.site_settings
  add column if not exists gaming_pricing jsonb;

update public.site_settings
set gaming_pricing = '{"markups": {"t1": 1.20, "t2": 1.15, "t3": 1.10, "t4": 1.07}}'::jsonb
where id = 1 and gaming_pricing is null;
