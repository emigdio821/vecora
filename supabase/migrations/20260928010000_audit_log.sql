-- Audit log: every insert, update and delete on the app's tables, so an admin
-- can reconstruct what happened when something looks wrong.
--
-- Model
--   * One generic row-level trigger (private.audit) on every table writes a
--     row with the identity (who did it), the operation, the full row before and after, the
--     list of changed columns, and a human label for the row.
--   * `refs` freezes display names for the foreign keys present in the row
--     (house number, category name, person name...) at write time, so an entry
--     stays readable after the referenced row is deleted or purged.
--   * `txid` groups the rows written by one statement or RPC (e.g. paying a
--     request = one transaction insert + one request update).
--   * No-op updates (only updated_at changed) are not recorded.
--
-- Access: admins read; nobody writes through the API. The trigger function is
-- security definer and owned by postgres, so its inserts bypass RLS. There are
-- no update or delete policies, which makes the log append-only from the app.
--
-- Identity is auth.uid(). It is null for jobs that don't run as a user (signup
-- trigger, nightly purge, seeds); the UI shows those as "Sistema".

create type public.audit_operation as enum ('insert', 'update', 'delete');

create table public.audit_log (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),
  identity_id    uuid references public.profiles (id) on delete set null,
  table_name     text not null,
  operation      public.audit_operation not null,
  -- the row's own id; null for tables with a composite key
  row_id         uuid,
  -- what the row is, for the list: house number, person name, concept...
  label          text not null,
  old_data       jsonb,
  new_data       jsonb,
  -- update only: columns whose value changed, updated_at excluded
  changed_fields text[],
  -- foreign key id -> display name, for every *_id / *_by column in the row
  refs           jsonb not null default '{}'::jsonb,
  txid           bigint not null default pg_current_xact_id()::text::bigint
);

comment on table public.audit_log is 'Append-only record of every insert, update and delete on the app tables. Admin read only.';
comment on column public.audit_log.label is 'Display name of the affected row, frozen at write time.';
comment on column public.audit_log.refs is 'Foreign key id -> display name, frozen at write time so entries stay readable after the target is gone.';
comment on column public.audit_log.txid is 'Postgres transaction id; rows sharing it were written by the same action.';

create index audit_log_occurred_at_idx on public.audit_log (occurred_at desc, id desc);
create index audit_log_table_row_idx on public.audit_log (table_name, row_id);
create index audit_log_identity_idx on public.audit_log (identity_id);

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

-- Display names for the foreign keys in a row, keyed by the id value.
create function private.audit_refs(r jsonb)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(kv.value, kv.label), '{}'::jsonb)
  from (
    select
      kv.value,
      case
        when kv.key = 'property_id' then
          (select p.number from public.properties p where p.id = kv.value::uuid)
        when kv.key = 'resident_id' then
          (select concat_ws(' ', re.first_name, re.last_name) from public.residents re where re.id = kv.value::uuid)
        when kv.key = 'category_id' then
          (select c.name from public.transaction_categories c where c.id = kv.value::uuid)
        when kv.key = 'period_id' then
          (select pe.name from public.periods pe where pe.id = kv.value::uuid)
        when kv.key = 'transaction_id' then
          (select t.description from public.transactions t where t.id = kv.value::uuid)
        when kv.key in ('profile_id', 'user_id', 'created_by', 'resolved_by', 'deleted_by', 'granted_by') then
          (select pr.full_name from public.profiles pr where pr.id = kv.value::uuid)
      end as label
    from jsonb_each_text(coalesce(r, '{}'::jsonb)) kv
    where kv.value is not null
  ) kv
  where kv.label is not null;
$$;

create function private.audit()
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
  end;

  insert into public.audit_log
    (identity_id, table_name, operation, row_id, label, old_data, new_data, changed_fields, refs)
  values
    (auth.uid(), tg_table_name, lower(tg_op)::public.audit_operation, (v_row ->> 'id')::uuid,
     coalesce(v_label, ''), v_old, v_new, v_changed, v_refs);

  return null;
end;
$$;

comment on function private.audit is 'Row-level trigger: records the change in public.audit_log with identity, before/after and frozen display names.';

-- ---------------------------------------------------------------------------
-- attach to every app table
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'properties', 'residents', 'property_residents',
    'periods', 'transactions', 'transaction_categories',
    'hall_reservations', 'maintenance_requests', 'security_requests',
    'profiles', 'user_roles'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.audit()',
      t || '_audit', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- grants and RLS
-- ---------------------------------------------------------------------------
revoke all on table public.audit_log from anon, authenticated;
grant select on table public.audit_log to authenticated;

revoke execute on function private.audit_refs(jsonb) from public, anon, authenticated;
revoke execute on function private.audit() from public, anon, authenticated;

alter table public.audit_log enable row level security;

create policy "audit_log: admins can read"
  on public.audit_log for select to authenticated
  using ((select private.is_admin()));
