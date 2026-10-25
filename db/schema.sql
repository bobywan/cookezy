create table if not exists recipes (
  id text primary key,
  slug text unique not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists recipe_requests (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists recipe_images (
  id text primary key,
  source_url text,
  bytes bytea,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists rate_limits (
  bucket text primary key,
  count integer not null,
  reset_at timestamptz not null
);
