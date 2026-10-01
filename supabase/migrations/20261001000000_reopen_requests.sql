-- Treasurer can take back a rejection (a mistake, or the requester clarified it
-- in person): the request goes back to pending, editable by its section and
-- payable again, instead of a duplicate being filed. Paid requests stay closed;
-- undoing one means reversing its expense. The rejection reason is cleared
-- (pending rows can't carry one); the audit log keeps it.

create function public.reopen_maintenance_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.request_status;
begin
  if not private.has_role('treasurer') then
    raise exception 'only the treasurer can reopen a request' using errcode = '42501';
  end if;

  select status into v_status from public.maintenance_requests where id = p_request_id for update;
  if not found then
    raise exception 'request % not found', p_request_id using errcode = 'P0002';
  end if;
  if v_status <> 'rejected' then
    raise exception 'request % is %, not rejected', p_request_id, v_status using errcode = 'P0003';
  end if;

  update public.maintenance_requests
  set status = 'pending', resolved_by = null, resolved_at = null, rejection_reason = null
  where id = p_request_id;
end;
$$;

comment on function public.reopen_maintenance_request is 'Treasurer only: moves a rejected maintenance request back to pending.';

create function public.reopen_security_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.request_status;
begin
  if not private.has_role('treasurer') then
    raise exception 'only the treasurer can reopen a request' using errcode = '42501';
  end if;

  select status into v_status from public.security_requests where id = p_request_id for update;
  if not found then
    raise exception 'request % not found', p_request_id using errcode = 'P0002';
  end if;
  if v_status <> 'rejected' then
    raise exception 'request % is %, not rejected', p_request_id, v_status using errcode = 'P0003';
  end if;

  update public.security_requests
  set status = 'pending', resolved_by = null, resolved_at = null, rejection_reason = null
  where id = p_request_id;
end;
$$;

comment on function public.reopen_security_request is 'Treasurer only: moves a rejected security request back to pending.';

revoke execute on function public.reopen_maintenance_request from public, anon;
revoke execute on function public.reopen_security_request from public, anon;
grant execute on function public.reopen_maintenance_request to authenticated;
grant execute on function public.reopen_security_request to authenticated;
