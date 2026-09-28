-- Settings: the residential's own details, one row for the whole deployment.
-- Starts with the name shown in the sidebar (and later in reports); more
-- fields (address, logo, defaults) can be added to the same row.
--
--   * Exactly one row, created here: the app only ever updates it.
--   * Every board member reads it; only the president (or an admin) edits it.
--   * Audited like any other table, so a rename shows up in "Historial".

create table public.settings (
  id               uuid primary key default gen_random_uuid(),
  -- always true and unique: there can only be one row
  singleton        boolean not null default true unique,
  residential_name text not null default '',
  updated_at       timestamptz not null default now(),

  constraint settings_singleton check (singleton),
  constraint settings_residential_name_trimmed check (residential_name = btrim(residential_name))
);

comment on table public.settings is 'Single row with the residential''s own details (name...). Read by everyone on the board, edited by the president.';
comment on column public.settings.residential_name is 'Shown in the sidebar and reports. Empty means the app falls back to its generic label.';

insert into public.settings default values;

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit: label the row with the name so the log reads "Editó Ajustes · Loma Verde"
-- ---------------------------------------------------------------------------
create or replace function private.audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old     jsonb;
  v_new     jsonb;
  v_row     jsonb;
  v_changed text[];
  v_refs    jsonb;
  v_label   text;
begin
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new); end if;
  v_row := coalesce(v_new, v_old);

  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into v_changed
    from jsonb_each(v_new) n
    where n.key <> 'updated_at' and n.value is distinct from v_old -> n.key;

    -- nothing but updated_at moved: not worth a row
    if v_changed is null then return null; end if;
  end if;

  -- Old first so a changed foreign key keeps both names.
  v_refs := private.audit_refs(v_old) || private.audit_refs(v_new);

  v_label := case tg_table_name
    when 'properties'             then v_row ->> 'number'
    when 'residents'              then concat_ws(' ', v_row ->> 'first_name', v_row ->> 'last_name')
    when 'periods'                then v_row ->> 'name'
    when 'transaction_categories' then v_row ->> 'name'
    when 'transactions'           then v_row ->> 'description'
    when 'maintenance_requests'   then v_row ->> 'title'
    when 'security_requests'      then v_row ->> 'title'
    when 'profiles'               then v_row ->> 'full_name'
    when 'property_residents'     then v_refs ->> (v_row ->> 'property_id')
    when 'hall_reservations'      then v_refs ->> (v_row ->> 'property_id')
    when 'user_roles'             then v_refs ->> (v_row ->> 'user_id')
    when 'settings'               then v_row ->> 'residential_name'
  end;

  insert into public.audit_log
    (identity_id, table_name, operation, row_id, label, old_data, new_data, changed_fields, refs)
  values
    (auth.uid(), tg_table_name, lower(tg_op)::public.audit_operation, (v_row ->> 'id')::uuid,
     coalesce(v_label, ''), v_old, v_new, v_changed, v_refs);

  return null;
end;
$$;

create trigger settings_audit
  after insert or update or delete on public.settings
  for each row execute function private.audit();

-- ---------------------------------------------------------------------------
-- grants and RLS
-- ---------------------------------------------------------------------------
revoke all on table public.settings from anon;
-- no insert/delete: the row is created above and never goes away
grant select, update on table public.settings to authenticated;

alter table public.settings enable row level security;

create policy "settings: members can read"
  on public.settings for select to authenticated
  using (true);

create policy "settings: president can update"
  on public.settings for update to authenticated
  using ((select private.has_role('president')))
  with check ((select private.has_role('president')));
