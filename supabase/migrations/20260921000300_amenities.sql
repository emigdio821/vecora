-- Common areas (terrace, pool, gym...) and their reservations, with the
-- payments those carry.
--
-- Model
--   * Each residential lists its own areas; the president adds them in the
--     app, no migration needed. An area with bookings is retired with
--     is_active = false instead of deleted.
--   * An area is booked by the day, one house per area per day; the unique
--     index on (amenity_id, reserved_on) is what makes a double booking
--     impossible. The board records reservations (residents ask in person);
--     every member can see them.
--   * Most areas are free; a booking may carry a fee (e.g. electricity) in
--     amount, paid in full when booking. 0 means free: there is nothing to
--     collect. The area's default_fee pre-fills it.
--   * Collecting it is an income row in the amenity_fee category linked back
--     via transactions.amenity_reservation_id. The status is derived, never
--     stored: paid while that row is live. Deleting the income in Transactions
--     puts the reservation back to pending; restoring it marks it paid again.
--   * A paid reservation is not deleted but cancelled (treasurer only): the
--     row stays as history, the day is freed, and an optional refund (up to
--     what was paid) is an expense in the amenity_refund category. The income
--     stays where it was, so a refund in a later month doesn't rewrite a past
--     report.
--   * An unpaid reservation is still simply deleted by the board.
--   * Both categories are system categories (key, seeded with the treasury):
--     Transactions can't create them by hand and only lets their receipt
--     details change. One pair serves every area; the description names it.
--
-- Booking by the day fits a terrace or a party hall. Hourly slots (gym, pool)
-- would swap reserved_on for a time range and the unique index for an
-- exclusion constraint (btree_gist is already installed).

-- ---------------------------------------------------------------------------
-- amenities: the bookable areas of the residential
-- ---------------------------------------------------------------------------
create table public.amenities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  default_fee numeric(12,2) not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint amenities_name_not_blank check (btrim(name) <> ''),
  constraint amenities_default_fee_not_negative check (default_fee >= 0)
);

create unique index amenities_name_unique on public.amenities (lower(name));

comment on table public.amenities is 'Bookable common areas (terrace, pool...). Retire with is_active = false; areas with reservations cannot be deleted.';
comment on column public.amenities.default_fee is 'Fee proposed when booking, in MXN; each reservation can change it. 0 = free.';

create trigger amenities_set_updated_at
  before update on public.amenities
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- amenity_reservations
-- ---------------------------------------------------------------------------
create table public.amenity_reservations (
  id           uuid primary key default gen_random_uuid(),
  amenity_id   uuid not null references public.amenities (id) on delete restrict,
  property_id  uuid not null references public.properties (id) on delete cascade,
  reserved_on  date not null,
  amount       numeric(12,2) not null,
  notes        text,
  cancelled_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete restrict,
  created_by   uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint amenity_reservations_notes_not_blank check (notes is null or btrim(notes) <> ''),
  constraint amenity_reservations_amount_not_negative check (amount >= 0),
  constraint amenity_reservations_cancellation_consistent check ((cancelled_at is null) = (cancelled_by is null))
);

comment on table public.amenity_reservations is 'Bookings of a common area, one house per area per day.';
comment on column public.amenity_reservations.amount is 'Price of the booking in MXN, paid in full. 0 = free.';
comment on column public.amenity_reservations.cancelled_at is 'Set by cancel_amenity_reservation. A cancelled booking frees its day and never changes again.';

-- One booking per area per day, the whole point of the table; a cancelled
-- booking no longer holds its day. The app's error mapping looks for this name.
create unique index amenity_reservations_one_per_day
  on public.amenity_reservations (amenity_id, reserved_on) where cancelled_at is null;

create index amenity_reservations_property_id_idx on public.amenity_reservations (property_id);

create trigger amenity_reservations_set_updated_at
  before update on public.amenity_reservations
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- transactions: link to the reservation
-- ---------------------------------------------------------------------------
-- set null: deleting an unpaid reservation leaves its soft-deleted payments as
-- plain history. Live payments block the delete (trigger below).
alter table public.transactions
  add column amenity_reservation_id uuid references public.amenity_reservations (id) on delete set null;

comment on column public.transactions.amenity_reservation_id is 'The common area booking this fee or refund belongs to.';

create index transactions_amenity_reservation_id_idx
  on public.transactions (amenity_reservation_id) where amenity_reservation_id is not null;

-- One live fee and one live refund per booking.
create unique index transactions_one_per_amenity_reservation_category
  on public.transactions (amenity_reservation_id, category_id)
  where amenity_reservation_id is not null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

-- "Terraza 3 Octubre 2026": the tail of the fee / refund description. The
-- house is in property_id, and the lists show it in its own column.
create function private.amenity_reservation_day(p_amenity_id uuid, p_reserved_on date)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select (select a.name from public.amenities a where a.id = p_amenity_id)
    || ' ' || extract(day from p_reserved_on)::int || ' '
    || (array['Enero','Febrero','Marzo','Abril','Mayo','Junio',
              'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'])[extract(month from p_reserved_on)::int]
    || ' ' || extract(year from p_reserved_on)::int;
$$;

revoke execute on function private.amenity_reservation_day(uuid, date) from public, anon, authenticated;

-- "Terraza 3 Octubre 2026 - Casa A1": names a booking in the audit log.
create function private.amenity_reservation_label(p_amenity_id uuid, p_reserved_on date, p_property_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select private.amenity_reservation_day(p_amenity_id, p_reserved_on)
    || ' - Casa ' || (select p.number from public.properties p where p.id = p_property_id);
$$;

revoke execute on function private.amenity_reservation_label(uuid, date, uuid) from public, anon, authenticated;

-- Once money is recorded against a booking, its area, house and price are what
-- the ledger says; the day can still move. Deleting it would orphan the income.
create function private.guard_paid_amenity_reservation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and new.amount = old.amount
     and new.property_id = old.property_id
     and new.amenity_id = old.amenity_id then
    return new;
  end if;

  if exists (
    select 1 from public.transactions t
    where t.amenity_reservation_id = old.id and t.deleted_at is null
  ) then
    if tg_op = 'DELETE' then
      raise exception 'reservation % is paid, cancel it instead', old.id using errcode = 'P0003';
    end if;
    raise exception 'reservation % is paid, its area, house and amount are fixed', old.id using errcode = 'P0003';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger amenity_reservations_guard_paid
  before update or delete on public.amenity_reservations
  for each row execute function private.guard_paid_amenity_reservation();

-- ---------------------------------------------------------------------------
-- payment and cancellation RPCs (treasurer)
-- ---------------------------------------------------------------------------
-- security definer: the ledger and the cancellation columns are off limits to
-- the board's policies. Both functions check the role themselves.

create function public.pay_amenity_reservation(
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
  v_reservation    public.amenity_reservations%rowtype;
  v_category_id    uuid;
  v_period_id      uuid;
  v_transaction_id uuid;
begin
  if not private.has_role('treasurer') then
    raise exception 'only the treasurer can record a reservation payment' using errcode = '42501';
  end if;

  if p_payment_method = 'transfer' and nullif(btrim(p_reference), '') is null then
    raise exception 'a transfer needs a reference' using errcode = '22023';
  end if;

  select * into v_reservation from public.amenity_reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'reservation % not found', p_reservation_id using errcode = 'P0002';
  end if;
  if v_reservation.cancelled_at is not null then
    raise exception 'reservation % is cancelled', p_reservation_id using errcode = 'P0003';
  end if;
  if v_reservation.amount = 0 then
    raise exception 'reservation % has no cost', p_reservation_id using errcode = '22023';
  end if;

  select id into v_category_id from public.transaction_categories where key = 'amenity_fee';

  if exists (
    select 1 from public.transactions
    where amenity_reservation_id = p_reservation_id and category_id = v_category_id and deleted_at is null
  ) then
    raise exception 'reservation % is already paid', p_reservation_id using errcode = 'P0003';
  end if;

  select id into v_period_id from public.periods where p_occurred_on between starts_on and ends_on;
  if not found then
    raise exception 'no period covers %', p_occurred_on using errcode = 'P0002';
  end if;

  insert into public.transactions
    (kind, category_id, period_id, property_id, amenity_reservation_id, amount, occurred_on,
     payment_method, folio, reference, description, notes)
  values
    ('income', v_category_id, v_period_id, v_reservation.property_id, v_reservation.id,
     v_reservation.amount, p_occurred_on, p_payment_method, nullif(btrim(p_folio), ''),
     nullif(btrim(p_reference), ''),
     'Tarifa ' || private.amenity_reservation_day(v_reservation.amenity_id, v_reservation.reserved_on),
     nullif(btrim(p_notes), ''))
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

comment on function public.pay_amenity_reservation is 'Treasurer only: records the fee of a common area booking as income linked to it.';

create function public.cancel_amenity_reservation(
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
  v_reservation public.amenity_reservations%rowtype;
  v_paid        numeric;
  v_period_id   uuid;
begin
  if not private.has_role('treasurer') then
    raise exception 'only the treasurer can cancel a paid reservation' using errcode = '42501';
  end if;

  if p_refund_amount is null or p_refund_amount < 0 then
    raise exception 'the refund cannot be negative' using errcode = '22023';
  end if;

  select * into v_reservation from public.amenity_reservations where id = p_reservation_id for update;
  if not found then
    raise exception 'reservation % not found', p_reservation_id using errcode = 'P0002';
  end if;
  if v_reservation.cancelled_at is not null then
    raise exception 'reservation % is already cancelled', p_reservation_id using errcode = 'P0003';
  end if;

  select coalesce(sum(t.amount), 0) into v_paid
  from public.transactions t
  join public.transaction_categories c on c.id = t.category_id
  where t.amenity_reservation_id = p_reservation_id and c.key = 'amenity_fee' and t.deleted_at is null;

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
      (kind, category_id, period_id, property_id, amenity_reservation_id, amount, occurred_on,
       payment_method, reference, description, notes)
    values
      ('expense', (select id from public.transaction_categories where key = 'amenity_refund'), v_period_id,
       v_reservation.property_id, v_reservation.id, p_refund_amount, p_occurred_on, p_payment_method,
       nullif(btrim(p_reference), ''),
       'Reembolso ' || private.amenity_reservation_day(v_reservation.amenity_id, v_reservation.reserved_on),
       nullif(btrim(p_notes), ''));
  end if;

  update public.amenity_reservations
  set cancelled_at = now(), cancelled_by = auth.uid()
  where id = p_reservation_id;
end;
$$;

comment on function public.cancel_amenity_reservation is 'Treasurer only: cancels a common area booking, frees its day and records the refund (if any) as an expense.';

revoke execute on function public.pay_amenity_reservation from public, anon;
revoke execute on function public.cancel_amenity_reservation from public, anon;
grant execute on function public.pay_amenity_reservation to authenticated;
grant execute on function public.cancel_amenity_reservation to authenticated;

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------
revoke all on table public.amenities from anon;
revoke all on table public.amenity_reservations from anon;
grant select, insert, update, delete on table public.amenities to authenticated;
grant select, insert, update, delete on table public.amenity_reservations to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.amenities enable row level security;
alter table public.amenity_reservations enable row level security;

-- amenities: the president's, like the rest of Presidency
create policy "amenities: members can read"
  on public.amenities for select to authenticated
  using (true);

create policy "amenities: president can insert"
  on public.amenities for insert to authenticated
  with check ((select private.has_role('president')));

create policy "amenities: president can update"
  on public.amenities for update to authenticated
  using ((select private.has_role('president')))
  with check ((select private.has_role('president')));

create policy "amenities: president can delete"
  on public.amenities for delete to authenticated
  using ((select private.has_role('president')));

-- amenity_reservations: cancelled bookings are history, and only the RPC cancels
create policy "amenity_reservations: members can read"
  on public.amenity_reservations for select to authenticated
  using (true);

create policy "amenity_reservations: board can insert"
  on public.amenity_reservations for insert to authenticated
  with check (
    ((select private.has_role('president')) or (select private.has_role('treasurer')))
    and cancelled_at is null
  );

create policy "amenity_reservations: board can update"
  on public.amenity_reservations for update to authenticated
  using (
    ((select private.has_role('president')) or (select private.has_role('treasurer')))
    and cancelled_at is null
  )
  with check (
    ((select private.has_role('president')) or (select private.has_role('treasurer')))
    and cancelled_at is null
  );

create policy "amenity_reservations: board can delete"
  on public.amenity_reservations for delete to authenticated
  using (
    ((select private.has_role('president')) or (select private.has_role('treasurer')))
    and cancelled_at is null
  );
