-- The terraza is free; a booking only carries an optional extra fee (e.g.
-- electricity), so its payment reads "Tarifa de terraza" (the category's
-- name since 20260924210000_treasury.sql). The category key stays hall_rent.

create or replace function public.pay_hall_reservation(
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
     'Tarifa de terraza ' || private.hall_reservation_label(v_reservation.reserved_on, v_reservation.property_id),
     nullif(btrim(p_notes), ''))
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

comment on function public.pay_hall_reservation is 'Treasurer only: records the fee of a terraza booking as income linked to it.';
