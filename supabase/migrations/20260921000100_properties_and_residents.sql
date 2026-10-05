-- Properties (houses / units), residents (people), and the link between them.
--
-- Model
--   * A property is a unit in the community, identified by its number ("12B").
--   * A resident is a person in the registry. One row per person.
--   * property_residents links people to units, many-to-many, with a
--     relationship: owner, tenant or family. A person can own several units;
--     a unit can have several owners (a couple) plus tenants and family.
--   * A resident may optionally be linked to an app account (profiles) so the
--     signed-in user can be matched to their registry entry. Most residents
--     will never log in, so this is nullable.
--
-- Access: every member reads; president (and admin) writes.
-- The registry is the president's section.
--
-- Deletion: properties and residents are soft-deleted (deleted_at / deleted_by)
-- so an accidental delete can be undone. Nobody hard-deletes through the API;
-- a nightly pg_cron job purges rows soft-deleted more than 6 months ago, but
-- only if nothing references them (see purge_soft_deleted, next to the ledger).
-- Deleting is for mistakes only (a typo duplicate, a test row). A resident who
-- moves out is *not* deleted: the row is a permanent fact, and time-bound data
-- (who lived where, who sat on the board) lives in dated link tables.
-- property_residents itself is hard-deleted: unlinking is a normal edit.

-- ---------------------------------------------------------------------------
-- soft delete helper: stamp who deleted / clear on restore
-- ---------------------------------------------------------------------------
create function private.set_deleted_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.deleted_at is not null and old.deleted_at is null then
    new.deleted_by := (select auth.uid());
  elsif new.deleted_at is null then
    new.deleted_by := null;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
create table public.properties (
  id         uuid primary key default gen_random_uuid(),
  number     text not null,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,

  constraint properties_number_not_blank check (btrim(number) <> '')
);

-- Case-insensitive ("12b" = "12B"); only among live rows so a number can be
-- reused after its unit was deleted by mistake and purged or re-created.
create unique index properties_number_unique
  on public.properties (lower(number))
  where deleted_at is null;

comment on table public.properties is 'Houses / units in the community. Soft-deleted via deleted_at.';
comment on column public.properties.number is 'Human identifier such as "12B" or "Casa 4". Unique among live rows.';
comment on column public.properties.deleted_at is 'Soft delete marker. Null = live. Purged after 6 months if unreferenced by history.';

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function private.set_updated_at();

create trigger properties_set_deleted_by
  before update of deleted_at on public.properties
  for each row execute function private.set_deleted_by();

-- ---------------------------------------------------------------------------
-- residents
-- ---------------------------------------------------------------------------
create table public.residents (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id) on delete set null,
  first_name text not null,
  last_name  text not null,
  phone      text not null,
  email      text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,

  constraint residents_first_name_not_blank check (btrim(first_name) <> ''),
  constraint residents_last_name_not_blank check (btrim(last_name) <> ''),
  constraint residents_phone_not_blank check (btrim(phone) <> ''),
  constraint residents_email_not_blank check (btrim(email) <> ''),
  -- one registry entry per app account
  constraint residents_profile_id_unique unique (profile_id)
);

-- Optional: most residents never log in. Required (by the app) at the moment an
-- account is created for them, since it becomes the login. Unique when present,
-- case-insensitive like auth emails, among live rows only.
create unique index residents_email_unique
  on public.residents (lower(email))
  where deleted_at is null and email is not null;

comment on table public.residents is 'People in the community registry. Linked to units via property_residents. Soft-deleted via deleted_at.';
comment on column public.residents.profile_id is 'Optional link to the resident''s app account.';
comment on column public.residents.email is 'Optional. Unique among live rows when present. Becomes the login email if an account is created for this resident.';
comment on column public.residents.phone is 'Contact number. Not unique: relatives often share one.';
comment on column public.residents.deleted_at is 'Soft delete marker. Null = live. Purged after 6 months if unreferenced by history.';

create trigger residents_set_updated_at
  before update on public.residents
  for each row execute function private.set_updated_at();

create trigger residents_set_deleted_by
  before update of deleted_at on public.residents
  for each row execute function private.set_deleted_by();

-- A resident's email becomes their login when they join the board, so it can't
-- be one that another account already signs in with (say, an admin created by
-- hand in the dashboard, who has no resident). Auth would refuse the invite
-- anyway, but only at the last step; this stops it when the email is saved.
--
-- Fires on insert and on email changes only: addBoardMember's rollback clears
-- profile_id before deleting the account it just created, and a check on that
-- update would block it.
create function private.check_resident_email()
returns trigger
language plpgsql
security definer -- auth.users is out of reach for authenticated
set search_path = ''
as $$
begin
  if new.email is not null and exists (
    select 1 from auth.users u
    where lower(u.email) = lower(new.email) and u.id is distinct from new.profile_id
  ) then
    -- Unique violation, named like a constraint so the app maps it like the others.
    raise exception 'email already used by another account (residents_email_account)'
      using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger residents_check_email
  before insert or update of email on public.residents
  for each row execute function private.check_resident_email();

-- ---------------------------------------------------------------------------
-- property_residents: who is attached to which unit, and how
-- ---------------------------------------------------------------------------
create type public.residency_relationship as enum ('owner', 'tenant', 'family');

-- Links are history ("who lived where, when"), so they must outlive any hard
-- delete of their endpoints: restrict, not cascade. The purge job skips
-- referenced rows; anything else that tries to hard-delete gets an error.
create table public.property_residents (
  property_id  uuid not null references public.properties (id) on delete restrict,
  resident_id  uuid not null references public.residents (id) on delete restrict,
  relationship public.residency_relationship not null,
  created_at   timestamptz not null default now(),

  primary key (property_id, resident_id)
);

comment on table public.property_residents is 'Many-to-many link between residents and properties with the kind of relationship.';

-- primary key already covers lookups by property; this covers lookups by person
create index property_residents_resident_id_idx on public.property_residents (resident_id);

-- ---------------------------------------------------------------------------
-- create_resident: insert a resident and, optionally, link them to a house
-- ---------------------------------------------------------------------------
-- One transaction, so a failed link never leaves a half-created resident
-- behind (and a retry doesn't trip over its now-taken email).
--
-- security invoker: both inserts run as the caller, so the existing RLS
-- policies (president can insert residents / property_residents) still apply.
create function public.create_resident(
  p_first_name   text,
  p_last_name    text,
  p_phone        text,
  p_email        text default null,
  p_notes        text default null,
  p_property_id  uuid default null,
  p_relationship public.residency_relationship default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_resident_id uuid;
begin
  if (p_property_id is null) <> (p_relationship is null) then
    raise exception 'p_property_id and p_relationship must be given together'
      using errcode = '22023'; -- invalid_parameter_value
  end if;

  -- The FK accepts soft-deleted houses; linking to one would be invisible.
  if p_property_id is not null and not exists (
    select 1 from public.properties
    where id = p_property_id and deleted_at is null
  ) then
    raise exception 'property % not found', p_property_id
      using errcode = 'P0002'; -- no_data_found
  end if;

  insert into public.residents (first_name, last_name, phone, email, notes)
  values (p_first_name, p_last_name, p_phone, p_email, p_notes)
  returning id into v_resident_id;

  if p_property_id is not null then
    insert into public.property_residents (property_id, resident_id, relationship)
    values (p_property_id, v_resident_id, p_relationship);
  end if;

  return v_resident_id;
end;
$$;

comment on function public.create_resident is 'Creates a resident and optionally links them to a house, atomically. Runs with the caller''s RLS.';

revoke execute on function public.create_resident from public, anon;
grant execute on function public.create_resident to authenticated;

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
revoke all on table public.properties from anon;
revoke all on table public.residents from anon;
revoke all on table public.property_residents from anon;

-- No DELETE on the soft-deleted tables: "delete" is an UPDATE of deleted_at.
-- Explicit revoke: Supabase's default privileges grant ALL to authenticated.
grant select, insert, update on table public.properties to authenticated;
grant select, insert, update on table public.residents to authenticated;
revoke delete on table public.properties from authenticated;
revoke delete on table public.residents from authenticated;
grant select, insert, update, delete on table public.property_residents to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.properties enable row level security;
alter table public.residents enable row level security;
alter table public.property_residents enable row level security;

-- properties
create policy "properties: members can read"
  on public.properties for select to authenticated
  using (true);

create policy "properties: president can insert"
  on public.properties for insert to authenticated
  with check ((select private.has_role('president')));

-- update covers soft delete and restore (deleted_at), so no delete policy
create policy "properties: president can update"
  on public.properties for update to authenticated
  using ((select private.has_role('president')))
  with check ((select private.has_role('president')));

-- residents
create policy "residents: members can read"
  on public.residents for select to authenticated
  using (true);

create policy "residents: president can insert"
  on public.residents for insert to authenticated
  with check ((select private.has_role('president')));

-- update covers soft delete and restore (deleted_at), so no delete policy
create policy "residents: president can update"
  on public.residents for update to authenticated
  using ((select private.has_role('president')))
  with check ((select private.has_role('president')));

-- property_residents
create policy "property_residents: members can read"
  on public.property_residents for select to authenticated
  using (true);

create policy "property_residents: president can insert"
  on public.property_residents for insert to authenticated
  with check ((select private.has_role('president')));

create policy "property_residents: president can update"
  on public.property_residents for update to authenticated
  using ((select private.has_role('president')))
  with check ((select private.has_role('president')));

create policy "property_residents: president can delete"
  on public.property_residents for delete to authenticated
  using ((select private.has_role('president')));
