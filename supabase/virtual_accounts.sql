-- Optional but recommended for reliable wallet funding credit.
-- Run in Supabase SQL Editor if virtual_accounts does not exist yet.

create table if not exists public.virtual_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_number text not null,
  bank_name text,
  account_name text,
  amount numeric(14, 2) not null default 0,
  external_ref text,
  reserved_account_id text,
  status text not null default 'pending',
  expire_at text,
  transaction_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists virtual_accounts_account_number_idx
  on public.virtual_accounts (account_number);

create index if not exists virtual_accounts_user_idx
  on public.virtual_accounts (user_id, created_at desc);

alter table public.virtual_accounts enable row level security;

-- Service role bypasses RLS; users can only read their own rows if needed later.
drop policy if exists "virtual_accounts_select_own" on public.virtual_accounts;
create policy "virtual_accounts_select_own" on public.virtual_accounts
  for select using (auth.uid() = user_id);
