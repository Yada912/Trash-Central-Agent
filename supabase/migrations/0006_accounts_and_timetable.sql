-- Migration 0006: Accounts and Petugas Timetable Slots
create table if not exists public.accounts (
  id text primary key,
  name text not null,
  email text not null unique,
  password text,
  role text not null,
  badge_id text,
  kecamatan text not null,
  desa text not null,
  banjar_name text,
  tps3r_node text,
  birth_date text,
  address text not null,
  lat double precision default -8.6562,
  lng double precision default 115.2124,
  account_type text not null default 'household',
  waste_profile jsonb,
  created_at text not null default now(),
  updated_at text not null default now()
);

create index if not exists accounts_email_idx on public.accounts (email);
create index if not exists accounts_role_idx on public.accounts (role);
create index if not exists accounts_kecamatan_idx on public.accounts (kecamatan);

create table if not exists public.timetable_slots (
  id text primary key,
  kecamatan text not null,
  stream text not null,
  days jsonb not null,
  window_start text not null,
  window_end text not null,
  leeway_minutes integer not null,
  surge_tolerance_pct integer not null,
  max_liters_per_pickup integer not null,
  notes text,
  updated_at text not null default now()
);

create index if not exists timetable_slots_kecamatan_idx on public.timetable_slots (kecamatan);
create index if not exists timetable_slots_stream_idx on public.timetable_slots (stream);

alter table public.accounts enable row level security;
alter table public.timetable_slots enable row level security;

