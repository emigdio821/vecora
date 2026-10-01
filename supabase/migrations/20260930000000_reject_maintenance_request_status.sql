-- 20260928000000_security.sql renamed maintenance_request_status to
-- request_status, but plpgsql bodies are stored as text, so this function still
-- declared the old name and failed on every call ("type does not exist").
-- Same body, new type name; create or replace keeps the grants and comment.

create or replace function public.reject_maintenance_request(p_request_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.request_status;
begin
  if not private.has_role('treasurer') then
    raise exception 'only the treasurer can reject a request' using errcode = '42501';
  end if;

  if nullif(btrim(p_reason), '') is null then
    raise exception 'a rejection needs a reason' using errcode = '22023';
  end if;

  select status into v_status from public.maintenance_requests where id = p_request_id for update;
  if not found then
    raise exception 'request % not found', p_request_id using errcode = 'P0002';
  end if;
  if v_status <> 'pending' then
    raise exception 'request % is already %', p_request_id, v_status using errcode = 'P0003';
  end if;

  update public.maintenance_requests
  set status = 'rejected', resolved_by = auth.uid(), resolved_at = now(), rejection_reason = btrim(p_reason)
  where id = p_request_id;
end;
$$;
