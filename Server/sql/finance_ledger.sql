-- Finance Ledger (Supabase Postgres) — append-only
-- Apply this in Supabase SQL editor.

-- Extensions
create extension if not exists pgcrypto;

-- Core table
create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),

  -- These ids reference Mongo ObjectIds; stored as text with checks
  event_id text not null,
  actor_user_id text not null,

  direction text not null check (direction in ('DEBIT','CREDIT')),
  kind text not null,

  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'INR',

  status text not null default 'APPROVED' check (status in ('PENDING','APPROVED','REJECTED')),

  reference_transaction_id uuid null references public.finance_transactions(id),

  note text null,
  reason text null,
  metadata jsonb not null default '{}'::jsonb,

  request_id text null,

  created_at timestamptz not null default now()
);

-- Mongo ObjectId format checks (24 hex chars)
alter table public.finance_transactions
  drop constraint if exists finance_transactions_event_id_format;
alter table public.finance_transactions
  add constraint finance_transactions_event_id_format
  check (event_id ~ '^[a-fA-F0-9]{24}$');

alter table public.finance_transactions
  drop constraint if exists finance_transactions_actor_user_id_format;
alter table public.finance_transactions
  add constraint finance_transactions_actor_user_id_format
  check (actor_user_id ~ '^[a-fA-F0-9]{24}$');

create index if not exists idx_finance_tx_event_created
  on public.finance_transactions (event_id, created_at desc);

create index if not exists idx_finance_tx_reference
  on public.finance_transactions (reference_transaction_id);

create index if not exists idx_finance_tx_request
  on public.finance_transactions (request_id);

-- Approvals (optional but judge-friendly)
create table if not exists public.finance_approvals (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.finance_transactions(id) on delete cascade,
  approver_user_id text not null,
  decision text not null check (decision in ('APPROVED','REJECTED')),
  reason text null,
  request_id text null,
  created_at timestamptz not null default now()
);

alter table public.finance_approvals
  drop constraint if exists finance_approvals_approver_user_id_format;
alter table public.finance_approvals
  add constraint finance_approvals_approver_user_id_format
  check (approver_user_id ~ '^[a-fA-F0-9]{24}$');

create index if not exists idx_finance_approvals_tx
  on public.finance_approvals (transaction_id, created_at desc);

-- Append-only enforcement
create or replace function public.finance_prevent_update_delete()
returns trigger as $$
begin
  raise exception 'finance_transactions is append-only';
end;
$$ language plpgsql;

drop trigger if exists trg_finance_tx_no_update on public.finance_transactions;
drop trigger if exists trg_finance_tx_no_delete on public.finance_transactions;

create trigger trg_finance_tx_no_update
before update on public.finance_transactions
for each row execute function public.finance_prevent_update_delete();

create trigger trg_finance_tx_no_delete
before delete on public.finance_transactions
for each row execute function public.finance_prevent_update_delete();

-- Convenience view: running balance per event
create or replace view public.finance_event_balances as
select
  event_id,
  currency,
  sum(case when direction='CREDIT' and status='APPROVED' then amount_cents else 0 end) as credits_cents,
  sum(case when direction='DEBIT'  and status='APPROVED' then amount_cents else 0 end) as debits_cents,
  (
    sum(case when direction='CREDIT' and status='APPROVED' then amount_cents else 0 end)
    -
    sum(case when direction='DEBIT'  and status='APPROVED' then amount_cents else 0 end)
  ) as balance_cents
from public.finance_transactions
group by event_id, currency;
