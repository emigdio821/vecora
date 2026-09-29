-- The main admin: admin@vecora.com, named "Vecora Admin". It is the app's own
-- account, not a resident's, so the board can't take it away: it keeps the
-- admin role, its name and its email, and it can't be deleted. Other admins
-- (residents holding the role) are removed as usual.
--
-- Creating admin@vecora.com (dashboard or seed) is all the setup it needs: the
-- signup trigger flags it, names it and grants the role. The guards check the
-- flag, which the app can't write.

alter table public.profiles add column is_main_admin boolean not null default false;

create unique index profiles_one_main_admin on public.profiles (is_main_admin) where is_main_admin;

comment on column public.profiles.is_main_admin is 'The app''s own admin account (admin@vecora.com). Set on signup, read-only for the app.';

-- Only the columns the app edits; is_main_admin stays out of reach. A new
-- column the app should edit needs adding here.
revoke update on table public.profiles from authenticated;
grant update (full_name, welcomed_at) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- signup: set up the main admin when its account is created
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
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

-- An account that already exists (hosted: created by hand in the dashboard).
update public.profiles p
set is_main_admin = true, full_name = 'Vecora Admin'
from auth.users u
where u.id = p.id and lower(u.email) = 'admin@vecora.com';

insert into public.user_roles (user_id, role)
select id, 'admin' from public.profiles where is_main_admin
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- guards
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
