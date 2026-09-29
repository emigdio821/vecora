-- Welcome dialog: shown once per account, on the first visit to the app. The
-- flag lives on the profile rather than in the browser so it follows the user
-- to every device. Users set it on their own row (existing update policy).

alter table public.profiles add column welcomed_at timestamptz;

comment on column public.profiles.welcomed_at is 'When the user closed the welcome dialog; null until then.';

-- Closing the dialog is bookkeeping, not something "Historial" should list:
-- updates that only touch welcomed_at are skipped like those that only touch
-- updated_at. Same function as in 20260928020000_settings.sql otherwise.
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
    where n.key not in ('updated_at', 'welcomed_at') and n.value is distinct from v_old -> n.key;

    -- nothing but bookkeeping columns moved: not worth a row
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
