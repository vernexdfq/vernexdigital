-- ============================================================
-- Boost retail markup (admin-editable, shared across the panel)
-- Stored in site_settings so the Boost pricing admin page can
-- update what customers pay without redeploying.
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

alter table public.site_settings
  add column if not exists boost_pricing jsonb;

update public.site_settings
set boost_pricing = '{"markup": 0.25}'::jsonb
where id = 1 and boost_pricing is null;
