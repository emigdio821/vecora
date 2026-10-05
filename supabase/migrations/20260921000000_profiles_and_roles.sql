-- Resido: profiles, roles, and the RLS helper every section will use.
--
-- Access model
--   * Every signed-in HOA member can READ every section.
--   * Each role (president, treasurer, security, maintenance) can WRITE only
--     in its own section.
--   * admin can WRITE everywhere.
--
-- Section tables added later follow this pattern:
--   select  -> to authenticated using (true)
--   write   -> to authenticated using/with check ((select private.has_role('treasurer')))
--
-- Mesa directiva: the board manages its own membership.
--
-- A board member is a resident with an app account (profiles) holding at least
-- one role (user_roles). Only board members may sign in; the app enforces it
-- at login and in the authed layout (an account with zero roles is turned
-- away). Accounts are created/removed through the Auth Admin API from a server
-- action, never by self-signup (enable_signup is off in config.toml).
--
-- The president joins admin in granting/revoking roles, with one limit: only
-- an admin can hand out or take away the admin role.
--
-- The main admin: admin@vecora.com, named "Vecora Admin". It is the app's own
-- account, not a resident's, so the board can't take it away: it keeps the
-- admin role, its name and its email, and it can't be deleted. Other admins
-- (residents holding the role) are removed as usual.
--
-- Creating admin@vecora.com (dashboard or seed) is all the setup it needs: the
-- signup trigger flags it, names it and grants the role. The guards check the
-- flag, which the app can't write.

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
-- Personal data (phone, house...) lives in residents; a profile is the account only.
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- Welcome dialog: shown once per account, on the first visit to the app. The
  -- flag lives on the profile rather than in the browser so it follows the user
  -- to every device. Users set it on their own row.
  welcomed_at   timestamptz,
  is_main_admin boolean not null default false
);

create unique index profiles_one_main_admin on public.profiles (is_main_admin) where is_main_admin;

comment on table public.profiles is 'Public-facing member profile. One row per auth.users row.';
comment on column public.profiles.welcomed_at is 'When the user closed the welcome dialog; null until then.';
comment on column public.profiles.is_main_admin is 'The app''s own admin account (admin@vecora.com). Set on signup, read-only for the app.';

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

comment on table public.user_roles is 'Role assignments = board membership. Admin and president may change it; only admin touches the admin role.';

create index user_roles_granted_by_idx on public.user_roles (granted_by);

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

-- True when the current user holds `r` OR is an admin.
-- security definer so it can read user_roles from inside user_roles' own
-- policies without recursing. It only ever looks at the calling user's rows.
create function private.has_role(r public.app_role)
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

create function private.is_admin()
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
create function private.set_updated_at()
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

-- ---------------------------------------------------------------------------
-- signup: create the profile, and set up the main admin when its account is created
-- ---------------------------------------------------------------------------
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_main boolean := coalesce(lower(new.email) = 'admin@vecora.com', false);
begin
  insert into public.profiles (id, full_name, is_main_admin)
  values (
    new.id,
    case when v_is_main then 'Vecora Admin' else coalesce(new.raw_user_meta_data ->> 'full_name', '') end,
    v_is_main
  );

  if v_is_main then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- An account that already exists (hosted: created by hand in the dashboard).
update public.profiles p
set is_main_admin = true, full_name = 'Vecora Admin'
from auth.users u
where u.id = p.id and lower(u.email) = 'admin@vecora.com';

insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles where is_main_admin
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- main admin guards
-- ---------------------------------------------------------------------------
-- Raised with P0004 so the app can tell it apart from other errors.

create function private.protect_main_admin_account()
returns trigger
language plpgsql
security definer -- Auth deletes users as its own role, which can't read profiles
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.email is not distinct from old.email then
    return new;
  end if;

  if exists (select 1 from public.profiles where id = old.id and is_main_admin) then
    raise exception 'the main admin account can''t be deleted or change its email'
      using errcode = 'P0004';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger protect_main_admin
  before update of email or delete on auth.users
  for each row execute function private.protect_main_admin_account();

create function private.protect_main_admin_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.role = 'admin' and exists (
    select 1 from public.profiles where id = old.user_id and is_main_admin
  ) then
    raise exception 'the main admin keeps the admin role' using errcode = 'P0004';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger user_roles_protect_main_admin
  before update or delete on public.user_roles
  for each row execute function private.protect_main_admin_role();

create function private.protect_main_admin_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_main_admin and new.full_name is distinct from 'Vecora Admin' then
    raise exception 'the main admin is named Vecora Admin' using errcode = 'P0004';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_main_admin
  before update on public.profiles
  for each row execute function private.protect_main_admin_name();

-- ---------------------------------------------------------------------------
-- grants: no anonymous access anywhere; authenticated gets what RLS then limits
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon;
revoke all on table public.user_roles from anon;

grant select on table public.profiles to authenticated;
-- Only the columns the app edits; is_main_admin stays out of reach. A new
-- column the app should edit needs adding here. Explicit revoke: Supabase's
-- default privileges grant ALL to authenticated.
revoke update on table public.profiles from authenticated;
grant update (full_name, welcomed_at) on table public.profiles to authenticated;
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

create policy "user_roles: board managers can insert"
  on public.user_roles for insert to authenticated
  with check (
    (select private.is_admin())
    or ((select private.has_role('president')) and role <> 'admin')
  );

-- (user_id, role) is the primary key, so an update would only ever re-key a
-- row; the app deletes + inserts instead. Kept admin-only.
create policy "user_roles: admin can update"
  on public.user_roles for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "user_roles: board managers can delete"
  on public.user_roles for delete to authenticated
  using (
    (select private.is_admin())
    or ((select private.has_role('president')) and role <> 'admin')
  );
