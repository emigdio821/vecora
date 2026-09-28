-- Financial report: everything the PDF needs for a date range, in one call.
--
--   * security invoker: runs with the member's own session, so the usual
--     "members can read" policies apply. No new permission surface.
--   * Money is counted by occurred_on (the day it moved). The opening balance
--     is every live movement before the range, across all periods, so the
--     closing balance matches the cash on hand.
--   * Fee status is counted by fee_month (the month a fee covers), for the
--     months of the range that fall inside a period and have already started.
--     A month counts as paid only if the payment was recorded by the end of
--     the range, so a past report reads the same no matter when it's pulled.
--   * Houses are identified by number only; the report is meant to be shared.

create function public.financial_report(p_from date, p_to date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if p_from is null or p_to is null or p_from > p_to then
    raise exception 'Rango de fechas inválido' using errcode = '22023';
  end if;

  return (
    with
    tx as (
      select t.kind, t.amount, t.occurred_on, c.name as category
      from public.transactions t
      join public.transaction_categories c on c.id = t.category_id
      where t.deleted_at is null
    ),
    in_range as (
      select * from tx where occurred_on between p_from and p_to
    ),
    totals as (
      select
        coalesce((
          select sum(case o.kind when 'income' then o.amount else -o.amount end)
          from tx o
          where o.occurred_on < p_from
        ), 0)::numeric(12,2)                                              as opening,
        coalesce(sum(r.amount) filter (where r.kind = 'income'), 0)::numeric(12,2)  as income,
        coalesce(sum(r.amount) filter (where r.kind = 'expense'), 0)::numeric(12,2) as expense
      from in_range r
    ),
    categories as (
      select kind, category, sum(amount)::numeric(12,2) as total, count(*)::int as movements
      from in_range
      group by kind, category
    ),
    -- fee months of the range that belong to a period and have started
    due as (
      select distinct gs::date as fee_month
      from public.periods p
      cross join lateral generate_series(
        date_trunc('month', greatest(p.starts_on, p_from)),
        date_trunc('month', least(p.ends_on, p_to, current_date)),
        interval '1 month'
      ) gs
      where p.starts_on <= p_to and p.ends_on >= p_from
    ),
    house_status as (
      select
        pr.number,
        coalesce(
          array_agg(d.fee_month order by d.fee_month) filter (where paid.id is null),
          '{}'::date[]
        ) as unpaid
      from public.properties pr
      cross join due d
      left join lateral (
        select t.id
        from public.transactions t
        where t.property_id = pr.id
          and t.fee_month = d.fee_month
          and t.category_id = (select id from public.transaction_categories where key = 'fee')
          and t.deleted_at is null
          and t.occurred_on <= p_to
        limit 1
      ) paid on true
      where pr.deleted_at is null
      group by pr.id, pr.number
    )
    select jsonb_build_object(
      'from',            p_from,
      'to',              p_to,
      'opening_balance', t.opening,
      'total_income',    t.income,
      'total_expense',   t.expense,
      'closing_balance', (t.opening + t.income - t.expense)::numeric(12,2),

      'categories', coalesce((
        select jsonb_agg(jsonb_build_object(
          'kind', c.kind, 'name', c.category, 'total', c.total, 'movements', c.movements
        ) order by c.kind, c.total desc, c.category)
        from categories c
      ), '[]'::jsonb),

      'fee_status', jsonb_build_object(
        'months',     (select count(*) from due),
        'houses',     (select count(*) from house_status),
        'up_to_date', (select count(*) from house_status where unpaid = '{}'),
        'pending', coalesce((
          select jsonb_agg(jsonb_build_object('house', hs.number, 'months', to_jsonb(hs.unpaid))
                           order by hs.number)
          from house_status hs
          where hs.unpaid <> '{}'
        ), '[]'::jsonb)
      )
    )
    from totals t
  );
end;
$$;

comment on function public.financial_report is 'Report for a date range: balances, totals by category and fee status per house.';

revoke execute on function public.financial_report(date, date) from public, anon;
grant execute on function public.financial_report(date, date) to authenticated;
