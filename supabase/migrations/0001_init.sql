-- Central Trash Agent. Service-role key bypasses RLS. No anon policies are defined.

create table if not exists reports (
  id text primary key,
  is_demo boolean not null,
  created_at text not null,
  lat double precision not null,
  lng double precision not null,
  kecamatan text not null,
  desa text,
  description text not null,
  description_en text,
  photo_url text,
  classification jsonb not null,
  edited boolean not null default false,
  status text not null,
  provenance text,
  estimated_weight_kg double precision
);

create index if not exists reports_kecamatan_idx on reports (kecamatan);
create index if not exists reports_status_idx on reports (status);
create index if not exists reports_created_at_idx on reports (created_at);

create table if not exists facilities (
  id text primary key,
  name text not null,
  kind text not null,
  lat double precision,
  lng double precision,
  address text,
  source_url text,
  verified boolean not null default false
);

create table if not exists plans (
  id text primary key,
  status text not null,
  version integer not null,
  input jsonb not null,
  result jsonb not null,
  explanation jsonb not null,
  decisions jsonb not null
);

alter table reports enable row level security;
alter table facilities enable row level security;
alter table plans enable row level security;
