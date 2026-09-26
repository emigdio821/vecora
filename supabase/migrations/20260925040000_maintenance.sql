-- Maintenance: what was done around the residential and what it cost, as a
-- request for the treasurer to pay.
--
-- Model
--   * The maintenance person records a job ("Pintura para el jardín", 300 MXN,
--     done on a date). Every row is a payment request and starts as pending.
--   * Only the treasurer (or admin) resolves it: "paid" records the expense in
--     the ledger and links it (transaction_id); "rejected" keeps the row with
--     the reason so the requester knows why.
--   * Pending rows are editable and deletable by their owners; resolved rows
--     are history and never change again.
--
-- Access: every member reads; maintenance (and admin) creates / edits / deletes
-- pending rows but can never change the status; treasurer (and admin) resolves
-- through the two RPCs below, which are the only way to leave "pending".

create type public.maintenance_request_status as enum ('pending', 'paid', 'rejected');

create table public.maintenance_requests (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  details          text,
  amount           numeric(12,2) not null,
  -- day the work was done or the purchase made
  requested_on     date not null default current_date,
  status           public.maintenance_request_status not null default 'pending',
  rejection_reason text,
  resolved_by      uuid references public.profiles (id) on delete restrict,
  resolved_at      timestamptz,
  transaction_id   uuid references public.transactions (id) on delete restrict,
  created_by       uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint maintenance_requests_title_not_blank check (btrim(title) <> ''),
  constraint maintenance_requests_amount_positive check (amount > 0),
  constraint maintenance_requests_transaction_unique unique (transaction_id),
  -- the resolution columns always agree with the status
  constraint maintenance_requests_resolution_consistent check (
    (status = 'pending'
      and resolved_by is null and resolved_at is null
      and transaction_id is null and rejection_reason is null)
    or (status = 'paid'
      and resolved_by is not null and resolved_at is not null
      and transaction_id is not null and rejection_reason is null)
    or (status = 'rejected'
      and resolved_by is not null and resolved_at is not null
      and transaction_id is null and btrim(coalesce(rejection_reason, '')) <> '')
  )
);

comment on table public.maintenance_requests is 'Maintenance jobs recorded by the maintenance role as payment requests for the treasurer.';
comment on column public.maintenance_requests.requested_on is 'Day the work was done or the purchase made, not when it was typed in.';
comment on column public.maintenance_requests.transaction_id is 'The expense recorded when the treasurer paid it. Set only while status = paid.';

create index maintenance_requests_status_requested_on_idx
  on public.maintenance_requests (status, requested_on desc);
create index maintenance_requests_created_by_idx on public.maintenance_requests (created_by);

create trigger maintenance_requests_set_updated_at
  before update on public.maintenance_requests
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- resolution RPCs (treasurer)
-- ---------------------------------------------------------------------------
-- security definer: the requester-side policies below never let anyone leave
-- "pending", so the treasurer's path has to bypass them. Both functions check
-- the role themselves before touching anything.

create function public.pay_maintenance_request(
  p_request_id     uuid,
  p_category_id    uuid,
  p_occurred_on    date,
  p_payment_method public.payment_method default 'cash',
  p_reference      text default null,
  p_notes          text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request        public.maintenance_requests%rowtype;
  v_period_id      uuid;
  v_transaction_id uuid;
begin
  if not private.has_role('treasurer') then
    raise exception 'only the treasurer can pay a request' using errcode = '42501';
  end if;

  if p_payment_method = 'transfer' and nullif(btrim(p_reference), '') is null then
    raise exception 'a transfer needs a reference' using errcode = '22023';
  end if;

  select * into v_request from public.maintenance_requests where id = p_request_id for update;
  if not found then
    raise exception 'request % not found', p_request_id using errcode = 'P0002';
  end if;
  if v_request.status <> 'pending' then
    raise exception 'request % is already %', p_request_id, v_request.status using errcode = 'P0003';
  end if;

  select id into v_period_id from public.periods where p_occurred_on between starts_on and ends_on;
  if not found then
    raise exception 'no period covers %', p_occurred_on using errcode = 'P0002';
  end if;

  -- The composite FK rejects an income category here.
  insert into public.transactions
    (kind, category_id, period_id, amount, occurred_on, payment_method, reference, description, notes)
  values
    ('expense', p_category_id, v_period_id, v_request.amount, p_occurred_on,
     p_payment_method, nullif(btrim(p_reference), ''), v_request.title, nullif(btrim(p_notes), ''))
  returning id into v_transaction_id;

  update public.maintenance_requests
  set status = 'paid', resolved_by = auth.uid(), resolved_at = now(), transaction_id = v_transaction_id
  where id = p_request_id;

  return v_transaction_id;
end;
$$;

comment on function public.pay_maintenance_request is 'Treasurer only: records the expense for a pending maintenance request and marks it paid, atomically.';

create function public.reject_maintenance_request(p_request_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.maintenance_request_status;
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

comment on function public.reject_maintenance_request is 'Treasurer only: marks a pending maintenance request as rejected with a reason.';

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
revoke all on table public.maintenance_requests from anon;
grant select, insert, update, delete on table public.maintenance_requests to authenticated;

revoke execute on function public.pay_maintenance_request from public, anon;
revoke execute on function public.reject_maintenance_request from public, anon;
grant execute on function public.pay_maintenance_request to authenticated;
grant execute on function public.reject_maintenance_request to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.maintenance_requests enable row level security;

create policy "maintenance_requests: members can read"
  on public.maintenance_requests for select to authenticated
  using (true);

create policy "maintenance_requests: maintenance can insert pending"
  on public.maintenance_requests for insert to authenticated
  with check ((select private.has_role('maintenance')) and status = 'pending');

-- Pending rows only, and they must stay pending: the status is the treasurer's.
create policy "maintenance_requests: maintenance can update pending"
  on public.maintenance_requests for update to authenticated
  using ((select private.has_role('maintenance')) and status = 'pending')
  with check ((select private.has_role('maintenance')) and status = 'pending');

create policy "maintenance_requests: maintenance can delete pending"
  on public.maintenance_requests for delete to authenticated
  using ((select private.has_role('maintenance')) and status = 'pending');
