-- Additive. Apply before the deploy that writes these columns.
-- Existing report inserts keep working if this has not been applied yet:
-- the app retries without the new columns when Postgres says they are missing.

alter table public.reports add column if not exists account_id text;
alter table public.reports add column if not exists collection_audit jsonb;

create index if not exists reports_account_id_idx on public.reports (account_id);

create table if not exists public.api_rate_limits (
  bucket text primary key,
  hits integer not null default 0,
  window_started_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
