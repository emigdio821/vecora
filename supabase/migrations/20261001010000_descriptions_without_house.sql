-- Fee and terraza descriptions no longer end in " - Casa A1": every movement
-- already carries its house (property_id), and the lists show it in its own
-- column. "Cuota agosto 2026 - Casa A1" becomes "Cuota Agosto 2026" (the app
-- capitalizes month names).

-- ---------------------------------------------------------------------------
-- terraza: the day alone for descriptions; the audit refs keep the house
-- ---------------------------------------------------------------------------

-- "3 Octubre 2026": the tail of the fee / refund description.
create function private.hall_reservation_day(p_reserved_on date)
returns text
language sql
immutable
set search_path = ''
as $$
  select extract(day from p_reserved_on)::int || ' '
    || (array['Enero','Febrero','Marzo','Abril','Mayo','Junio',
              'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'])[extract(month from p_reserved_on)::int]
    || ' ' || extract(year from p_reserved_on)::int;
$$;

revoke execute on function private.hall_reservation_day(date) from public, anon, authenticated;

-- "3 Octubre 2026 - Casa A1": names a booking in the audit log.
create or replace function private.hall_reservation_label(p_reserved_on date, p_property_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select private.hall_reservation_day(p_reserved_on)
    || ' - Casa ' || (select p.number from public.properties p where p.id = p_property_id);
$$;

-- Same function as in 20260929020000_rename_hall_rent_to_fee.sql, only the description changes.
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
     'Tarifa de terraza ' || private.hall_reservation_day(v_reservation.reserved_on),
     nullif(btrim(p_notes), ''))
  returning id into v_transaction_id;

  return v_transaction_id;
end;
$$;

-- Same function as in 20260929000000_hall_payments.sql, only the description changes.
create or replace function public.cancel_hall_reservation(
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
       'Reembolso de terraza ' || private.hall_reservation_day(v_reservation.reserved_on),
       nullif(btrim(p_notes), ''));
  end if;

  update public.hall_reservations
  set cancelled_at = now(), cancelled_by = auth.uid()
  where id = p_reservation_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- fees
-- ---------------------------------------------------------------------------
-- Same function as in 20260928040000_fee_description_dash.sql, only the label changes.
create or replace function public.record_fee_payment(
  p_property_id    uuid,
  p_fee_months     date[],
  p_occurred_on    date,
  p_folio          text,
  p_payment_method public.payment_method default 'cash',
  p_reference      text default null,
  p_notes          text default null,
  p_period_id      uuid default null,     -- default: the period that contains p_occurred_on
  p_amount         numeric default null,  -- per-month fee; default: the period's monthly_fee
  p_apply_late_fee boolean default null   -- null = by the due-day rule; true/false force it
)
returns table (fee_count integer, late_fee_count integer, total numeric)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_period       public.periods%rowtype;
  v_fee_cat      uuid;
  v_late_cat     uuid;
  v_amount       numeric;
  v_month        date;
  v_is_late      boolean;
  v_months       constant text[] := array['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                                          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  v_label        text;
begin
  if p_fee_months is null or cardinality(p_fee_months) = 0 then
    raise exception 'at least one fee month is required' using errcode = '22023';
  end if;

  if p_payment_method = 'transfer' and nullif(btrim(p_reference), '') is null then
    raise exception 'a transfer needs a reference' using errcode = '22023';
  end if;

  select * into v_period from public.periods
  where id = coalesce(p_period_id, (select id from public.periods where p_occurred_on between starts_on and ends_on));
  if not found then
    raise exception 'no period covers %', p_occurred_on using errcode = 'P0002';
  end if;

  perform 1 from public.properties where id = p_property_id and deleted_at is null;
  if not found then
    raise exception 'property % not found', p_property_id using errcode = 'P0002';
  end if;

  select id into v_fee_cat  from public.transaction_categories where key = 'fee';
  select id into v_late_cat from public.transaction_categories where key = 'late_fee';

  v_amount := coalesce(p_amount, v_period.monthly_fee);
  fee_count := 0;
  late_fee_count := 0;
  total := 0;

  foreach v_month in array p_fee_months loop
    if extract(day from v_month) <> 1 then
      raise exception 'fee month % is not the first day of a month', v_month using errcode = '22023';
    end if;

    v_label := v_months[extract(month from v_month)::int] || ' ' || extract(year from v_month)::int;

    insert into public.transactions
      (kind, category_id, period_id, property_id, amount, occurred_on, fee_month,
       payment_method, folio, reference, description, notes)
    values
      ('income', v_fee_cat, v_period.id, p_property_id, v_amount, p_occurred_on, v_month,
       p_payment_method, p_folio, p_reference, 'Cuota ' || v_label, p_notes);
    fee_count := fee_count + 1;
    total := total + v_amount;

    -- Due on due_day of the month being paid; anything after that is late.
    v_is_late := coalesce(
      p_apply_late_fee,
      p_occurred_on > make_date(extract(year from v_month)::int, extract(month from v_month)::int, v_period.due_day)
    );

    if v_is_late and v_period.late_fee > 0 then
      insert into public.transactions
        (kind, category_id, period_id, property_id, amount, occurred_on, fee_month,
         payment_method, folio, reference, description)
      values
        ('income', v_late_cat, v_period.id, p_property_id, v_period.late_fee, p_occurred_on, v_month,
         p_payment_method, p_folio, p_reference, 'Recargo ' || v_label);
      late_fee_count := late_fee_count + 1;
      total := total + v_period.late_fee;
    end if;
  end loop;

  return next;
end;
$$;
