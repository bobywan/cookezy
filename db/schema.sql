create table if not exists recipes (
  id text primary key,
  slug text unique not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);
