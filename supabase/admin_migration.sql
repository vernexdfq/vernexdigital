-- Run in Supabase SQL Editor (after schema.sql if not already run)

-- Admin flag on profiles
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

create index if not exists profiles_is_admin_idx
  on public.profiles (is_admin)
  where is_admin = true;

-- Store configured admin email on site_settings
alter table public.site_settings
  add column if not exists admin_email text;

-- Optional: promote YOUR email to admin after you create the account
-- Replace the email below, then run:
--
-- update public.profiles
-- set is_admin = true
-- where email = 'your-admin@email.com';
