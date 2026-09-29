-- Resido: profiles, roles, and the RLS helper every section will use.
--
-- Access model
--   * Every signed-in HOA member can READ every section.
--   * Each role (president, treasurer, security, maintenance) can WRITE only
--     in its own section.
--   * admin can WRITE everywhere and is the only role that can assign roles.
--
-- Section tables added later follow this pattern:
--   select  -> to authenticated using (true)
--   write   -> to authenticated using/with check ((select private.has_role('treasurer')))

-- ---------------------------------------------------------------------------
-- private schema: helper functions that must never be exposed via the Data API
-- ---------------------------------------------------------------------------
create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------------
create type public.app_role as enum (
  'admin',
  'president',
  'treasurer',
  'security',
  'maintenance'
);

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on signup
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  unit_number text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Public-facing member profile. One row per auth.users row.';

-- ---------------------------------------------------------------------------
-- user_roles: a member may hold several roles
-- ---------------------------------------------------------------------------
create table public.user_roles (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is 'Role assignments. Only admins may change this table.';

create index user_roles_granted_by_idx on public.user_roles (granted_by);

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

-- True when the current user holds `r` OR is an admin.
-- security definer so it can read user_roles from inside user_roles' own
-- policies without recursing. It only ever looks at the calling user's rows.
create or replace function private.has_role(r public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role in (r, 'admin')
  );
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role('admin');
$$;

revoke execute on function private.has_role(public.app_role) from public, anon;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.has_role(public.app_role) to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;

-- Keep updated_at fresh.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Create a profile row whenever a user signs up.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- grants: no anonymous access anywhere; authenticated gets what RLS then limits
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon;
revoke all on table public.user_roles from anon;

grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_roles to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- profiles: every member can see the directory
create policy "profiles: members can read"
  on public.profiles
  for select
  to authenticated
  using (true);

-- profiles: you may edit your own row, admins may edit any
create policy "profiles: owner or admin can update"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id or (select private.is_admin()))
  with check ((select auth.uid()) = id or (select private.is_admin()));

-- user_roles: everyone can see who holds which role
create policy "user_roles: members can read"
  on public.user_roles
  for select
  to authenticated
  using (true);

-- user_roles: only admins may assign or revoke roles
create policy "user_roles: admin can insert"
  on public.user_roles
  for insert
  to authenticated
  with check ((select private.is_admin()));

create policy "user_roles: admin can update"
  on public.user_roles
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "user_roles: admin can delete"
  on public.user_roles
  for delete
  to authenticated
  using ((select private.is_admin()));
