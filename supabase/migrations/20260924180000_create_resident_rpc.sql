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
