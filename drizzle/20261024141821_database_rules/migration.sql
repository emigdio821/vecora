-- What the TypeScript schema can't declare: two exclusion constraints, the
-- rows the app needs from the start, and the activity log's trigger.
-- Everything else about the data (who may do what, the rules of each
-- section) is in src/lib/services and the server functions.

-- ---------------------------------------------------------------------------
-- exclusion constraints
-- ---------------------------------------------------------------------------
-- btree_gist: equality on plain columns inside a gist exclusion (the folio).
create extension if not exists btree_gist;
--> statement-breakpoint

-- Two periods can't cover the same day.
alter table periods
  add constraint periods_no_overlap
  exclude using gist (daterange(starts_on, ends_on, '[]') with &&);
--> statement-breakpoint

-- A folio is the number of one paper receipt, and the receipt book never
-- repeats it. Every line of that receipt shares it (a fee and its late fee,
-- several months paid together), so it can't be a plain unique.
--
-- The lines of one receipt are always written in one database transaction,
-- and now() is fixed per transaction, so they share created_at: that makes
-- created_at the receipt's identity here. A deleted row frees its folio;
-- restoring it fails if the folio was used again meanwhile.
alter table transactions
  add constraint transactions_folio_one_receipt
  exclude using gist (folio with =, created_at with <>)
  where (folio is not null and deleted_at is null);
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- rows the app needs from the start
-- ---------------------------------------------------------------------------
-- The single settings row; the app only ever updates it.
insert into settings default values;
--> statement-breakpoint

-- The categories, in the HOA's language (Spanish). The ones with a key are the
-- app's own (fee, late fee, a common area's fee and its refund): they can be
-- renamed but not retired.
insert into transaction_categories (kind, name, key) values
  ('income',  'Cuota de mantenimiento',  'fee'),
  ('income',  'Recargo',                 'late_fee'),
  ('income',  'Multa',                   null),
  ('income',  'Tarifa de área común',    'amenity_fee'),
  ('income',  'Otro ingreso',            null),
  ('expense', 'Reembolso de área común', 'amenity_refund'),
  ('expense', 'Mantenimiento',           null),
  ('expense', 'Servicios',               null),
  ('expense', 'Jardinería',              null),
  ('expense', 'Vigilancia',              null),
  ('expense', 'Administración',          null),
  ('expense', 'Otro egreso',             null);
--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- activity log
-- ---------------------------------------------------------------------------
-- One trigger on every app table writes audit_log (see src/lib/db/schema/audit.ts).
-- Who acted comes from app.actor_id, which transactionAs() sets for the
-- transaction (src/lib/db/index.ts); unset, it's the app's own job ("Sistema").
create schema if not exists private;
--> statement-breakpoint

create function private.current_actor()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.actor_id', true), '')::uuid;
$$;
--> statement-breakpoint

-- "Terraza 3 Octubre 2026 - Casa A1": names a booking in the log.
create function private.amenity_reservation_label(p_amenity_id uuid, p_reserved_on date, p_property_id uuid)
returns text
language sql
stable
as $$
  select (select a.name from public.amenities a where a.id = p_amenity_id)
    || ' ' || extract(day from p_reserved_on)::int || ' '
    || (array['Enero','Febrero','Marzo','Abril','Mayo','Junio',
              'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'])[extract(month from p_reserved_on)::int]
    || ' ' || extract(year from p_reserved_on)::int
    || ' - Casa ' || (select p.number from public.properties p where p.id = p_property_id);
$$;
--> statement-breakpoint

-- The display names behind the foreign keys in a row, keyed by the id.
create function private.audit_refs(r jsonb)
returns jsonb
language sql
stable
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
        when kv.key = 'amenity_id' then
          (select a.name from public.amenities a where a.id = kv.value::uuid)
        when kv.key = 'amenity_reservation_id' then
          (select private.amenity_reservation_label(r.amenity_id, r.reserved_on, r.property_id)
           from public.amenity_reservations r where r.id = kv.value::uuid)
        when kv.key in ('user_id', 'created_by', 'resolved_by', 'deleted_by', 'cancelled_by') then
          (select u.name from public.users u where u.id = kv.value::uuid)
      end as label
    from jsonb_each_text(coalesce(r, '{}'::jsonb)) kv
    where kv.value is not null
  ) kv
  where kv.label is not null;
$$;
--> statement-breakpoint

create function private.audit()
returns trigger
language plpgsql
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

  -- A template's content can be megabytes (images), and the log loads every
  -- entry's data: it stays out.
  if tg_table_name = 'document_templates' then
    v_old := v_old - 'content';
    v_new := v_new - 'content';
  end if;

  v_row := coalesce(v_new, v_old);

  -- The main admin's own account, created when the app is set up: that's the
  -- app installing itself, before anyone on the board did anything.
  if tg_op = 'INSERT' and tg_table_name = 'users' and (v_new ->> 'is_main_admin')::boolean
     and private.current_actor() is null then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    -- Bookkeeping columns don't make an entry: the update time, closing the
    -- welcome dialog, the default password being replaced.
    select array_agg(n.key order by n.key) into v_changed
    from jsonb_each(v_new) n
    where n.key not in ('updated_at', 'welcomed_at', 'must_change_password')
      and n.value is distinct from v_old -> n.key;

    if v_changed is null then return null; end if;
  end if;

  -- Old first, so a changed foreign key keeps both names.
  v_refs := private.audit_refs(v_old) || private.audit_refs(v_new);

  v_label := case tg_table_name
    when 'properties'             then v_row ->> 'number'
    when 'residents'              then concat_ws(' ', v_row ->> 'first_name', v_row ->> 'last_name')
    when 'periods'                then v_row ->> 'name'
    when 'transaction_categories' then v_row ->> 'name'
    when 'transactions'           then v_row ->> 'description'
    when 'maintenance_requests'   then v_row ->> 'title'
    when 'security_requests'      then v_row ->> 'title'
    when 'users'                  then v_row ->> 'name'
    when 'amenities'              then v_row ->> 'name'
    when 'document_templates'     then v_row ->> 'name'
    when 'property_residents'     then v_refs ->> (v_row ->> 'property_id')
    when 'amenity_reservations'   then v_refs ->> (v_row ->> 'property_id')
    -- the log reads "Editó Ajustes - Loma Verde"
    when 'settings'               then v_row ->> 'residential_name'
  end;

  insert into public.audit_log
    (actor_id, table_name, operation, row_id, label, old_data, new_data, changed_fields, refs, txid)
  values
    (private.current_actor(), tg_table_name, lower(tg_op)::public.audit_operation, (v_row ->> 'id')::uuid,
     coalesce(v_label, ''), v_old, v_new, v_changed, v_refs, pg_current_xact_id()::text::bigint);

  return null;
end;
$$;
--> statement-breakpoint

do $$
declare
  t text;
begin
  foreach t in array array[
    'properties', 'residents', 'property_residents',
    'periods', 'transactions', 'transaction_categories',
    'amenities', 'amenity_reservations', 'maintenance_requests', 'security_requests',
    'users', 'settings', 'document_templates'
  ] loop
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.audit()',
      t || '_audit', t
    );
  end loop;
end;
$$;
--> statement-breakpoint

-- Passwords live in accounts, which isn't audited (its rows hold the hash).
-- A password, from wherever it came, is written on the account's user
-- instead: the first one as "password_set" (shown as "account activated"),
-- later ones as "password". Not the main admin's first password, nor its
-- forced change away from the default: that's setup. Only the account itself
-- can change its password in the app, so it's the actor.
create function private.audit_password()
returns trigger
language plpgsql
as $$
declare
  v_user  jsonb;
  v_field text := 'password';
begin
  select to_jsonb(u) into v_user from public.users u where u.id = new.user_id;

  if v_user is null or (v_user ->> 'must_change_password')::boolean then
    return null;
  end if;
  if tg_op = 'INSERT' and (v_user ->> 'is_main_admin')::boolean then
    return null;
  end if;

  if tg_op = 'INSERT' or coalesce(old.password, '') = '' then
    v_field := 'password_set';
  end if;

  insert into public.audit_log
    (actor_id, table_name, operation, row_id, label, old_data, new_data, changed_fields, txid)
  values
    (new.user_id, 'users', 'update', new.user_id, coalesce(v_user ->> 'name', ''),
     v_user, v_user, array[v_field], pg_current_xact_id()::text::bigint);

  return null;
end;
$$;
--> statement-breakpoint

create trigger accounts_audit_password
  after insert or update of password on accounts
  for each row
  when (new.provider_id = 'credential' and new.password is not null)
  execute function private.audit_password();
