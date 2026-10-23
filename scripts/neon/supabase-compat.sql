-- ===========================================================================
-- Supabase compatibility layer for Neon (migration branch only)
-- ===========================================================================
-- The bare minimum of what Supabase provides that supabase/migrations and the
-- seeds use, so they run unchanged on a Neon branch while the app moves over
-- (see scripts/neon/load-dev.ts). Nothing here is the end state: auth.users
-- gives way to Better Auth's tables on profiles, auth.uid() to
-- private.current_user_id(), and the storage stubs to the Neon bucket.

-- ---------------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------------
-- The migrations grant to these and their policies are `to authenticated`.
-- Nobody logs in as them. The owner is a member, so a transaction can
-- `set local role authenticated` and get the same grants and RLS as the app had
-- on Supabase.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
grant anon, authenticated, service_role to current_user;

-- What Supabase grants on public: everything, with RLS (and the migrations'
-- revokes) deciding the rest.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- extensions
-- ---------------------------------------------------------------------------
-- Supabase keeps them in their own schema and puts it on the search path. The
-- seeds hash passwords with extensions.crypt; btree_gist backs the exclusion
-- constraints (no overlapping periods, no double bookings).
create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
create extension pgcrypto with schema extensions;
create extension btree_gist with schema extensions;
-- New sessions only; the loader sets it on its own session too.
do $$
begin
  execute format('alter database %I set search_path = "$user", public, extensions', current_database());
end;
$$;

-- ---------------------------------------------------------------------------
-- auth
-- ---------------------------------------------------------------------------
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

-- The columns the migrations' triggers and the seeds' inserts use.
create table auth.users (
  instance_id                uuid,
  id                         uuid primary key,
  aud                        text,
  role                       text,
  email                      text unique,
  encrypted_password         text,
  email_confirmed_at         timestamptz,
  last_sign_in_at            timestamptz,
  raw_app_meta_data          jsonb,
  raw_user_meta_data         jsonb,
  created_at                 timestamptz default now(),
  updated_at                 timestamptz default now(),
  confirmation_token         text default '',
  recovery_token             text default '',
  email_change_token_new     text default '',
  email_change               text default '',
  email_change_token_current text default '',
  phone_change               text default '',
  phone_change_token         text default '',
  reauthentication_token     text default ''
);

create table auth.identities (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  provider_id     text not null,
  provider        text not null,
  identity_data   jsonb not null,
  last_sign_in_at timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (provider_id, provider)
);

-- Who is acting. app.user_id is what withUser() (src/lib/db/index.ts) sets;
-- request.jwt.claims is what Supabase sets, and how the seeds act as someone.
create function auth.uid()
returns uuid
language sql
stable
set search_path = ''
as $$
  select coalesce(
    nullif(current_setting('app.user_id', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

-- ---------------------------------------------------------------------------
-- storage
-- ---------------------------------------------------------------------------
-- Only so the logo bucket's row and policies have somewhere to go. Files live
-- in the Neon bucket (src/lib/storage), not here.
create schema storage;
grant usage on schema storage to anon, authenticated, service_role;

create table storage.buckets (
  id                 text primary key,
  name               text not null,
  public             boolean default false,
  file_size_limit    bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets (id),
  name       text,
  owner      uuid,
  created_at timestamptz default now()
);

alter table storage.objects enable row level security;
