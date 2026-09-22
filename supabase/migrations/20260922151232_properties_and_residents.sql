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

-- ---------------------------------------------------------------------------
-- properties
-- ---------------------------------------------------------------------------
create table public.properties (
  id         uuid primary key default gen_random_uuid(),
  number     text not null,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint properties_number_not_blank check (btrim(number) <> ''),
  constraint properties_number_unique unique (number)
);

comment on table public.properties is 'Houses / units in the community.';
comment on column public.properties.number is 'Human identifier such as "12B" or "Casa 4". Unique.';

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function private.set_updated_at();

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

  constraint residents_first_name_not_blank check (btrim(first_name) <> ''),
  constraint residents_last_name_not_blank check (btrim(last_name) <> ''),
  constraint residents_phone_not_blank check (btrim(phone) <> ''),
  -- one registry entry per app account
  constraint residents_profile_id_unique unique (profile_id)
);

comment on table public.residents is 'People in the community registry. Linked to units via property_residents.';
comment on column public.residents.profile_id is 'Optional link to the resident''s app account.';

create trigger residents_set_updated_at
  before update on public.residents
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- property_residents: who is attached to which unit, and how
-- ---------------------------------------------------------------------------
create type public.residency_relationship as enum ('owner', 'tenant', 'family');

create table public.property_residents (
  property_id  uuid not null references public.properties (id) on delete cascade,
  resident_id  uuid not null references public.residents (id) on delete cascade,
  relationship public.residency_relationship not null,
  created_at   timestamptz not null default now(),

  primary key (property_id, resident_id)
);

comment on table public.property_residents is 'Many-to-many link between residents and properties with the kind of relationship.';

-- primary key already covers lookups by property; this covers lookups by person
create index property_residents_resident_id_idx on public.property_residents (resident_id);

-- ---------------------------------------------------------------------------
-- profiles: personal data now lives in residents; keep profiles as the account only
-- ---------------------------------------------------------------------------
alter table public.profiles drop column unit_number;
alter table public.profiles drop column phone;

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
revoke all on table public.properties from anon;
revoke all on table public.residents from anon;
revoke all on table public.property_residents from anon;

grant select, insert, update, delete on table public.properties to authenticated;
grant select, insert, update, delete on table public.residents to authenticated;
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

create policy "properties: president can update"
  on public.properties for update to authenticated
  using ((select private.has_role('president')))
  with check ((select private.has_role('president')));

create policy "properties: president can delete"
  on public.properties for delete to authenticated
  using ((select private.has_role('president')));

-- residents
create policy "residents: members can read"
  on public.residents for select to authenticated
  using (true);

create policy "residents: president can insert"
  on public.residents for insert to authenticated
  with check ((select private.has_role('president')));

create policy "residents: president can update"
  on public.residents for update to authenticated
  using ((select private.has_role('president')))
  with check ((select private.has_role('president')));

create policy "residents: president can delete"
  on public.residents for delete to authenticated
  using ((select private.has_role('president')));

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
