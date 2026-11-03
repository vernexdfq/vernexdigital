-- Shared virtual-number pricing and durable customer order history.
-- Safe to run repeatedly; does not remove existing rows or alter wallet balances.

alter table public.site_settings
  add column if not exists virtual_number_pricing jsonb;

create table if not exists public.vn_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'grizzly',
  provider_order_id text not null,
  phone text not null default '',
  service text not null,
  country text not null default '',
  pool_id text,
  price_ngn numeric(14,2) not null default 0,
  wholesale_ngn numeric(14,2) not null default 0,
  status text not null default 'waiting',
  otp_code text,
  refunded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vn_orders add column if not exists wholesale_ngn numeric(14,2) not null default 0;
alter table public.vn_orders add column if not exists otp_code text;
alter table public.vn_orders add column if not exists refunded boolean not null default false;
alter table public.vn_orders add column if not exists updated_at timestamptz not null default now();
create index if not exists vn_orders_provider_order_idx
  on public.vn_orders(provider, provider_order_id) where provider_order_id <> '';
create index if not exists vn_orders_user_created_idx on public.vn_orders(user_id, created_at desc);
alter table public.vn_orders enable row level security;
drop policy if exists "vn_orders_select_own" on public.vn_orders;
create policy "vn_orders_select_own" on public.vn_orders for select using (auth.uid() = user_id);

-- Wallet debit and ledger entry happen as one database transaction.
create or replace function public.vn_wallet_debit(
  p_user_id uuid, p_amount numeric, p_title text, p_meta jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare new_balance numeric(14,2);
begin
  if p_amount <= 0 then return jsonb_build_object('ok', false, 'reason', 'invalid_amount'); end if;
  update public.wallets set balance = balance - p_amount, updated_at = now()
    where user_id = p_user_id and balance >= p_amount returning balance into new_balance;
  if not found then return jsonb_build_object('ok', false, 'reason', 'insufficient_balance'); end if;
  insert into public.transactions(user_id, kind, title, amount, status, meta)
    values (p_user_id, 'virtual_number', p_title, -p_amount, 'pending', coalesce(p_meta, '{}'::jsonb));
  return jsonb_build_object('ok', true, 'balance', new_balance);
end; $$;

-- Idempotent retail refund: repeated status/cancel requests cannot credit twice.
create or replace function public.vn_wallet_refund(
  p_user_id uuid, p_amount numeric, p_refund_key text, p_title text, p_meta jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare new_balance numeric(14,2);
begin
  if p_amount <= 0 or coalesce(p_refund_key, '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_refund');
  end if;
  perform pg_advisory_xact_lock(hashtext(p_user_id::text || ':' || p_refund_key));
  if exists (select 1 from public.transactions where user_id = p_user_id
    and kind = 'virtual_number_refund' and meta->>'refund_key' = p_refund_key) then
    return jsonb_build_object('ok', true, 'already_refunded', true);
  end if;
  update public.wallets set balance = balance + p_amount, updated_at = now()
    where user_id = p_user_id returning balance into new_balance;
  if not found then return jsonb_build_object('ok', false, 'reason', 'wallet_missing'); end if;
  insert into public.transactions(user_id, kind, title, amount, status, meta)
    values (p_user_id, 'virtual_number_refund', p_title, p_amount, 'completed',
      coalesce(p_meta, '{}'::jsonb) || jsonb_build_object('refund_key', p_refund_key));
  return jsonb_build_object('ok', true, 'balance', new_balance);
end; $$;

revoke all on function public.vn_wallet_debit(uuid,numeric,text,jsonb) from public, anon, authenticated;
revoke all on function public.vn_wallet_refund(uuid,numeric,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.vn_wallet_debit(uuid,numeric,text,jsonb) to service_role;
grant execute on function public.vn_wallet_refund(uuid,numeric,text,text,jsonb) to service_role;
