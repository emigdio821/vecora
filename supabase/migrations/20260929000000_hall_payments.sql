-- Terraza payments: a reservation is also a charge the treasurer collects.
--
-- Model
--   * A reservation carries its price (amount), paid in full when booking.
--     0 means "sin costo": there is nothing to collect.
--   * Collecting it is an income row in "Renta de terraza" linked back via
--     transactions.hall_reservation_id. The status is derived, never stored:
--     paid while that row is live. Deleting the income in "Movimientos" puts
--     the reservation back to pending; restoring it marks it paid again.
--   * A paid reservation is not deleted but cancelled (treasurer only): the
--     row stays as history, the day is freed, and an optional refund (up to
--     what was paid) is an expense in "Reembolso de terraza". The income stays
--     where it was, so a refund in a later month doesn't rewrite a past report.
--   * An unpaid reservation is still simply deleted by the board.
--   * Both categories are system categories (key): "Movimientos" can't create
--     them by hand and only lets their receipt details change.

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
-- "Renta de terraza" already exists (seeded as "Renta de salón"); key it by
-- name, and create it if the treasurer renamed or removed it.
insert into public.transaction_categories (kind, name, key) values
  ('income',  'Renta de terraza',     'hall_rent'),
  ('expense', 'Reembolso de terraza', 'hall_refund')
on conflict (kind, lower(name)) do update set key = excluded.key, is_active = true;

-- ---------------------------------------------------------------------------
-- hall_reservations: price and cancellation
-- ---------------------------------------------------------------------------
alter table public.hall_reservations
  add column amount       numeric(12,2) not null default 0,
  add column cancelled_at timestamptz,
  add column cancelled_by uuid references public.profiles (id) on delete restrict,
  add constraint hall_reservations_amount_not_negative check (amount >= 0),
  add constraint hall_reservations_cancellation_consistent check ((cancelled_at is null) = (cancelled_by is null));

-- Existing bookings become "sin costo"; new ones always say what they cost.
alter table public.hall_reservations alter column amount drop default;

comment on column public.hall_reservations.amount is 'Price of the booking in MXN, paid in full. 0 = sin costo.';
comment on column public.hall_reservations.cancelled_at is 'Set by cancel_hall_reservation. A cancelled booking frees its day and never changes again.';

-- A cancelled booking no longer holds its day. Same name as the old
-- constraint so the app's error mapping keeps working.
alter table public.hall_reservations drop constraint hall_reservations_one_per_day;
create unique index hall_reservations_one_per_day
  on public.hall_reservations (reserved_on) where cancelled_at is null;

-- ---------------------------------------------------------------------------
-- transactions: link to the reservation
-- ---------------------------------------------------------------------------
-- set null: deleting an unpaid reservation leaves its soft-deleted payments as
-- plain history. Live payments block the delete (trigger below).
alter table public.transactions
  add column hall_reservation_id uuid references public.hall_reservations (id) on delete set null;

comment on column public.transactions.hall_reservation_id is 'The terraza booking this rent or refund belongs to.';

create index transactions_hall_reservation_id_idx
  on public.transactions (hall_reservation_id) where hall_reservation_id is not null;

-- One live rent and one live refund per booking.
create unique index transactions_one_per_hall_reservation_category
  on public.transactions (hall_reservation_id, category_id)
  where hall_reservation_id is not null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

-- "3 octubre 2026 - Casa A1": the tail of the rent / refund description.
create function private.hall_reservation_label(p_reserved_on date, p_property_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select extract(day from p_reserved_on)::int || ' '
    || (array['enero','febrero','marzo','abril','mayo','junio',
              'julio','agosto','septiembre','octubre','noviembre','diciembre'])[extract(month from p_reserved_on)::int]
    || ' ' || extract(year from p_reserved_on)::int
    || ' - Casa ' || (select p.number from public.properties p where p.id = p_property_id);
$$;

revoke execute on function private.hall_reservation_label(date, uuid) from public, anon, authenticated;

-- Once money is recorded against a booking, its house and price are what the
-- ledger says; the day can still move. Deleting it would orphan the income.
create function private.guard_paid_hall_reservation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.amount = old.amount and new.property_id = old.property_id then
    return new;
  end if;

  if exists (
    select 1 from public.transactions t
    where t.hall_reservation_id = old.id and t.deleted_at is null
  ) then
    if tg_op = 'DELETE' then
      raise exception 'reservation % is paid, cancel it instead', old.id using errcode = 'P0003';
    end if;
    raise exception 'reservation % is paid, its house and amount are fixed', old.id using errcode = 'P0003';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger hall_reservations_guard_paid
  before update or delete on public.hall_reservations
  for each row execute function private.guard_paid_hall_reservation();

-- ---------------------------------------------------------------------------
-- payment and cancellation RPCs (treasurer)
-- ---------------------------------------------------------------------------
-- security definer: the ledger and the cancellation columns are off limits to
-- the board's policies. Both functions check the role themselves.

create function public.pay_hall_reservation(
  p_reservation_id uuid,
  p_occurred_on    date,
  p_folio          text default null,
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
  v_reservation    public.hall_reservations%rowtype;
  v_category_id    uuid;
  v_period_id      uuid;
  v_transaction_id uuid;
begin
  if not private.has_role('treasurer') then
    raise exception 'only the treasurer can record a terraza payment' using errcode = '42501';
  end if;

  if p_payment_method = 'transfer' and nullif(btrim(p_reference), '') is null then
    raise exception 'a transfer needs a reference' using errcode = '22023';
  end if;

  select * into v_reservation from public.hall_reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'reservation % not found', p_reservation_id using errcode = 'P0002';
  end if;
  if v_reservation.cancelled_at is not null then
    raise exception 'reservation % is cancelled', p_reservation_id using errcode = 'P0003';
  end if;
  if v_reservation.amount = 0 then
    raise exception 'reservation % has no cost', p_reservation_id using errcode = '22023';
  end if;

  select id into v_category_id from public.transaction_categories where key = 'hall_rent';

  if exists (
    select 1 from public.transactions
    where hall_reservation_id = p_reservation_id and category_id = v_category_id and deleted_at is null
  ) then
    raise exception 'reservation % is already paid', p_reservation_id using errcode = 'P0003';
  end if;

  select id into v_period_id from public.periods where p_occurred_on between starts_on and ends_on;
  if not found then
    raise exception 'no period covers %', p_occurred_on using errcode = 'P0002';
  end if;

  insert into public.transactions
    (kind, category_id, period_id, property_id, hall_reservation_id, amount, occurred_on,
     payment_method, folio, reference, description, notes)
  values
    ('income', v_category_id, v_period_id, v_reservation.property_id, v_reservation.id,
     v_reservation.amount, p_occurred_on, p_payment_method, nullif(btrim(p_folio), ''),
     nullif(btrim(p_reference), ''),
     'Renta de terraza ' || private.hall_reservation_label(v_reservation.reserved_on, v_reservation.property_id),
     nullif(btrim(p_notes), ''))
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

comment on function public.pay_hall_reservation is 'Treasurer only: records the rent of a terraza booking as income linked to it.';

create function public.cancel_hall_reservation(
  p_reservation_id uuid,
  p_refund_amount  numeric default 0,
  p_occurred_on    date default current_date,
  p_payment_method public.payment_method default 'cash',
  p_reference      text default null,
  p_notes          text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.hall_reservations%rowtype;
  v_paid        numeric;
  v_period_id   uuid;
begin
  if not private.has_role('treasurer') then
    raise exception 'only the treasurer can cancel a paid reservation' using errcode = '42501';
  end if;

  if p_refund_amount is null or p_refund_amount < 0 then
    raise exception 'the refund cannot be negative' using errcode = '22023';
  end if;

  select * into v_reservation from public.hall_reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'reservation % not found', p_reservation_id using errcode = 'P0002';
  end if;
  if v_reservation.cancelled_at is not null then
    raise exception 'reservation % is already cancelled', p_reservation_id using errcode = 'P0003';
  end if;

  select coalesce(sum(t.amount), 0) into v_paid
  from public.transactions t
  join public.transaction_categories c on c.id = t.category_id
  where t.hall_reservation_id = p_reservation_id and c.key = 'hall_rent' and t.deleted_at is null;

  if p_refund_amount > v_paid then
    raise exception 'the refund (%) exceeds what was paid (%)', p_refund_amount, v_paid using errcode = '22023';
  end if;

  if p_refund_amount > 0 then
    if p_payment_method = 'transfer' and nullif(btrim(p_reference), '') is null then
      raise exception 'a transfer needs a reference' using errcode = '22023';
    end if;

    select id into v_period_id from public.periods where p_occurred_on between starts_on and ends_on;
    if not found then
      raise exception 'no period covers %', p_occurred_on using errcode = 'P0002';
    end if;

    insert into public.transactions
      (kind, category_id, period_id, property_id, hall_reservation_id, amount, occurred_on,
       payment_method, reference, description, notes)
    values
      ('expense', (select id from public.transaction_categories where key = 'hall_refund'), v_period_id,
       v_reservation.property_id, v_reservation.id, p_refund_amount, p_occurred_on, p_payment_method,
       nullif(btrim(p_reference), ''),
       'Reembolso de terraza ' || private.hall_reservation_label(v_reservation.reserved_on, v_reservation.property_id),
       nullif(btrim(p_notes), ''));
  end if;

  update public.hall_reservations
  set cancelled_at = now(), cancelled_by = auth.uid()
  where id = p_reservation_id;
end;
$$;

comment on function public.cancel_hall_reservation is 'Treasurer only: cancels a terraza booking, frees its day and records the refund (if any) as an expense.';

revoke execute on function public.pay_hall_reservation from public, anon;
revoke execute on function public.cancel_hall_reservation from public, anon;
grant execute on function public.pay_hall_reservation to authenticated;
grant execute on function public.cancel_hall_reservation to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: cancelled bookings are history, and only the RPC cancels
-- ---------------------------------------------------------------------------
drop policy "hall_reservations: board can insert" on public.hall_reservations;
drop policy "hall_reservations: board can update" on public.hall_reservations;
drop policy "hall_reservations: board can delete" on public.hall_reservations;

create policy "hall_reservations: board can insert"
  on public.hall_reservations for insert to authenticated
  with check (
    ((select private.has_role('president')) or (select private.has_role('treasurer')))
    and cancelled_at is null
  );

create policy "hall_reservations: board can update"
  on public.hall_reservations for update to authenticated
  using (
    ((select private.has_role('president')) or (select private.has_role('treasurer')))
    and cancelled_at is null
  )
  with check (
    ((select private.has_role('president')) or (select private.has_role('treasurer')))
    and cancelled_at is null
  );

create policy "hall_reservations: board can delete"
  on public.hall_reservations for delete to authenticated
  using (
    ((select private.has_role('president')) or (select private.has_role('treasurer')))
    and cancelled_at is null
  );

-- ---------------------------------------------------------------------------
-- audit: names for the new references
-- ---------------------------------------------------------------------------
-- Same function as in 20260928010000_audit_log.sql plus hall_reservation_id
-- and cancelled_by.
create or replace function private.audit_refs(r jsonb)
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
        when kv.key = 'hall_reservation_id' then
          (select private.hall_reservation_label(h.reserved_on, h.property_id)
           from public.hall_reservations h where h.id = kv.value::uuid)
        when kv.key in ('profile_id', 'user_id', 'created_by', 'resolved_by', 'deleted_by', 'granted_by', 'cancelled_by') then
          (select pr.full_name from public.profiles pr where pr.id = kv.value::uuid)
      end as label
    from jsonb_each_text(coalesce(r, '{}'::jsonb)) kv
    where kv.value is not null
  ) kv
  where kv.label is not null;
$$;
