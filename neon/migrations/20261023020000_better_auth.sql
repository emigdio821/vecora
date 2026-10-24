-- ===========================================================================
-- Accounts move from Supabase Auth to Better Auth
-- ===========================================================================
-- Neon only (supabase/migrations is what hosted Supabase runs). Applied after
-- supabase/migrations, and after the seeds on a dev branch, by
-- scripts/neon/migrate.ts.
--
-- Better Auth's user table is public.profiles: it gains the email Supabase kept
-- in auth.users, and full_name is the user's name. Its own tables (sessions,
-- password accounts, one-time tokens) go in the auth schema, which Supabase's
-- auth.users leaves free. The triggers that watched auth.users now watch
-- profiles and auth.accounts.
--
-- Better Auth connects as vecora_auth (scripts/neon/app-role.ts gives it a
-- login). That role sees only what signing in needs: the auth tables and the
-- profiles. The app's own role (vecora_app, as authenticated) can't read the
-- auth tables at all.
--
-- Passwords aren't carried over: Supabase hashed them with bcrypt, Better Auth
-- with scrypt. Every account gets a new access link at cutover (dev branches:
-- scripts/neon/dev-passwords.ts).

-- ---------------------------------------------------------------------------
-- profiles: the account's email
-- ---------------------------------------------------------------------------
-- Better Auth looks accounts up by lowercase email, so they're stored that way.
-- Verified from the start: only the board creates accounts, for residents'
-- emails, and the account is proven by its access link.
-- image: part of Better Auth's user, which checks the column is there. Unused.
alter table public.profiles
  add column email text,
  add column email_verified boolean not null default true,
  add column image text;

-- Copying the emails over isn't anyone editing a profile: kept out of the activity log.
alter table public.profiles disable trigger profiles_audit;

update public.profiles p
set email = lower(u.email)
from auth.users u
where u.id = p.id;

alter table public.profiles enable trigger profiles_audit;

alter table public.profiles
  alter column email set not null,
  add constraint profiles_email_key unique (email),
  add constraint profiles_email_lowercase check (email = lower(email)),
  drop constraint profiles_id_fkey,
  alter column id set default gen_random_uuid();

comment on table public.profiles is 'An account (Better Auth''s user table). Person data lives in residents.';
comment on column public.profiles.email is 'Sign-in email, lowercase. Set when the board creates the account.';

-- The board creates accounts now (server-actions/hoa-board.ts), not Supabase's
-- signup. Admin and president, as for the roles they then grant.
grant insert (email, full_name) on table public.profiles to authenticated;

create policy "profiles: board managers can create accounts"
  on public.profiles
  for insert
  to authenticated
  with check ((select private.has_role('president')));

-- ---------------------------------------------------------------------------
-- Better Auth's tables
-- ---------------------------------------------------------------------------
-- Ids come from Better Auth (advanced.database.generateId: 'uuid').

create table auth.sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  token            text not null unique,
  expires_at       timestamptz not null,
  ip_address       text,
  user_agent       text,
  -- Opened with an access link, and no password typed since: such a session
  -- may only choose a password (src/lib/auth/index.ts).
  from_access_link boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index sessions_user_id_idx on auth.sessions (user_id);

-- One row per sign-in method. Only passwords ('credential') are used; the
-- token columns are for social sign-in, which Better Auth checks are there.
create table auth.accounts (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.profiles (id) on delete cascade,
  account_id               text not null,
  provider_id              text not null,
  password                 text,
  access_token             text,
  refresh_token            text,
  id_token                 text,
  access_token_expires_at  timestamptz,
  refresh_token_expires_at timestamptz,
  scope                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (provider_id, account_id)
);

create index accounts_user_id_idx on auth.accounts (user_id);

-- One-time tokens: the access links.
create table auth.verifications (
  id         uuid primary key default gen_random_uuid(),
  identifier text not null,
  value      text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index verifications_identifier_idx on auth.verifications (identifier);

-- ---------------------------------------------------------------------------
-- vecora_auth: Better Auth's role
-- ---------------------------------------------------------------------------
-- No login here; scripts/neon/app-role.ts adds it, with a password that stays
-- out of the migrations.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'vecora_auth') then
    create role vecora_auth nologin nobypassrls;
  end if;
end;
$$;

grant usage on schema auth, public to vecora_auth;
grant select, insert, update, delete on table auth.sessions, auth.accounts, auth.verifications to vecora_auth;
-- Signing in reads the account by email; it never writes one.
grant select on table public.profiles to vecora_auth;

create policy "profiles: better auth can read"
  on public.profiles
  for select
  to vecora_auth
  using (true);

-- ---------------------------------------------------------------------------
-- triggers: from auth.users to profiles and auth.accounts
-- ---------------------------------------------------------------------------

-- Signup: gone. The board inserts the profile; the main admin already exists.
drop trigger on_auth_user_created on auth.users;
drop function private.handle_new_user();

-- The main admin can't be deleted or change its email: on the profile now.
drop trigger protect_main_admin on auth.users;

create or replace function private.protect_main_admin_account()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.email is not distinct from old.email then
    return new;
  end if;

  if old.is_main_admin then
    raise exception 'the main admin account can''t be deleted or change its email'
      using errcode = 'P0004';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger profiles_protect_main_admin_account
  before update of email or delete on public.profiles
  for each row execute function private.protect_main_admin_account();

-- A password, from wherever it came. Better Auth writes it on its own
-- connection, with no user signed in; only the account itself can change it,
-- so it's the identity. Insert: the first password ("password_set", shown as
-- "account activated"). Update: a later one ("password"). Not logged: the
-- main admin's forced change away from the default, which is setup.
drop trigger on_auth_user_password_audit on auth.users;
drop trigger on_auth_user_password_changed on auth.users;

create or replace function private.audit_password_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile jsonb;
  v_field   text := 'password';
begin
  select to_jsonb(p) into v_profile from public.profiles p where p.id = new.user_id;

  -- No profile: not an app account.
  if v_profile is null then return null; end if;

  if (v_profile ->> 'must_change_password')::boolean then return null; end if;

  if tg_op = 'INSERT' then
    v_field := 'password_set';
  elsif coalesce(old.password, '') = '' then
    v_field := 'password_set';
  end if;

  insert into public.audit_log
    (identity_id, table_name, operation, row_id, label, old_data, new_data, changed_fields)
  values
    (new.user_id, 'profiles', 'update', new.user_id, coalesce(v_profile ->> 'full_name', ''),
     v_profile, v_profile, array[v_field]);

  return null;
end;
$$;

-- The default password is gone.
create or replace function private.handle_password_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set must_change_password = false
  where id = new.user_id and must_change_password;
  return null;
end;
$$;

-- Triggers on the same event fire in name order: the audit goes first, while
-- must_change_password still says whether this was the default being replaced.
create trigger accounts_password_audit
  after insert or update of password on auth.accounts
  for each row
  when (new.provider_id = 'credential' and new.password is not null)
  execute function private.audit_password_changed();

create trigger accounts_password_changed
  after insert or update of password on auth.accounts
  for each row
  when (new.provider_id = 'credential' and new.password is not null)
  execute function private.handle_password_changed();

-- A resident's email can't be another account's: profiles hold the emails now.
create or replace function private.check_resident_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is not null and exists (
    select 1 from public.profiles p
    where p.email = lower(new.email) and p.id is distinct from new.profile_id
  ) then
    -- Unique violation, named like a constraint so the app maps it like the others.
    raise exception 'email already used by another account (residents_email_account)'
      using errcode = '23505';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Supabase's accounts: nothing reads them any more
-- ---------------------------------------------------------------------------
drop table auth.identities;
drop table auth.users;
