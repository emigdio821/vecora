-- The app no longer uses "·" as a separator; fee descriptions read
-- "Cuota agosto 2026 - Casa A1". Same function as before, only the label changes.

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
  v_house        text;
  v_fee_cat      uuid;
  v_late_cat     uuid;
  v_amount       numeric;
  v_month        date;
  v_is_late      boolean;
  v_months       constant text[] := array['enero','febrero','marzo','abril','mayo','junio',
                                          'julio','agosto','septiembre','octubre','noviembre','diciembre'];
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

  select number into v_house from public.properties where id = p_property_id and deleted_at is null;
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

    v_label := v_months[extract(month from v_month)::int] || ' ' || extract(year from v_month)::int
               || ' - Casa ' || v_house;

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

-- Rows recorded before this change. The audit log keeps the old text and
-- shows this update as made by the system.
update public.transactions
set description = replace(description, ' · ', ' - ')
where description like '%·%';
