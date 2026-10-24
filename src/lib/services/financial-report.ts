// Everything the financial report (the PDF) needs for a date range, in one
// query.
//
//   * Money is counted by occurredOn (the day it moved). The opening balance
//     is every live movement before the range, across all periods, so the
//     closing balance matches the cash on hand.
//   * Balances and category totals are per currency: one entry for each
//     currency with movements up to the end of the range, the HOA's current
//     one first. With no movements at all, a single entry in the HOA's
//     currency, with zeros.
//   * Fee status is counted by feeMonth (the month a fee covers), for the
//     months of the range that fall in a period and have already started. A
//     month counts as paid only if the payment was recorded by the end of the
//     range, so a past report reads the same whenever it's pulled.
//   * Fees paid ahead: per house, the fee months after the range's last
//     month already paid by its end. The money still counts in the range it
//     was received in, not in the months it covers.
//   * Houses are identified by number only: the report is meant to be shared.
//
// The tables and their columns come from the schema, through the aliases
// below, so renaming one fails the typecheck instead of the report. The
// CTEs' own columns are plain names.
import { sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { Database } from '@/lib/db/client'
import { periods, properties, settings, transactionCategories, transactions } from '@/lib/db/schema'

const t = alias(transactions, 't')
const c = alias(transactionCategories, 'c')
const p = alias(periods, 'p')
const pr = alias(properties, 'pr')
const s = alias(settings, 's')

type Currency = 'MXN' | 'USD'

/** Totals of one currency; amounts in different currencies never add up. */
export interface CurrencyTotals {
  currency: Currency
  openingBalance: number
  totalIncome: number
  totalExpense: number
  closingBalance: number
  categories: { kind: 'income' | 'expense'; name: string; total: number; movements: number }[]
}

/** Dates are "YYYY-MM-DD" strings and amounts plain numbers. */
export interface FinancialReport {
  from: string
  to: string
  /** At least one; the HOA's current currency first. */
  currencies: CurrencyTotals[]
  feeStatus: {
    /** Fee months of the range that were due; 0 when no period covers it. */
    months: number
    houses: number
    upToDate: number
    pending: { house: string; months: string[] }[]
    /** Fee months after the range, already paid by its end. */
    advance: { house: string; months: string[] }[]
  }
}

export async function financialReport(
  db: Database,
  range: { from: string; to: string },
): Promise<FinancialReport> {
  const { from, to } = range
  const result = await db.execute<{ report: FinancialReport }>(sql`
    with
    fee_category as (
      select ${c.id} from ${transactionCategories} ${c} where ${c.key} = 'fee'
    ),
    tx as (
      select ${t.kind}, ${t.amount}, ${t.currency}, ${t.occurredOn}, ${c.name} as category
      from ${transactions} ${t}
      join ${transactionCategories} ${c} on ${c.id} = ${t.categoryId}
      where ${t.deletedAt} is null and ${t.occurredOn} <= ${to}::date
    ),
    in_range as (
      select * from tx where occurred_on >= ${from}::date
    ),
    currencies as (
      select distinct currency from tx
      union all
      select ${s.currency} from ${settings} ${s} where not exists (select 1 from tx)
    ),
    totals as (
      select
        cur.currency,
        coalesce(sum(case tx.kind when 'income' then tx.amount else -tx.amount end)
                 filter (where tx.occurred_on < ${from}::date), 0)::float8 as opening,
        coalesce(sum(tx.amount)
                 filter (where tx.kind = 'income' and tx.occurred_on >= ${from}::date), 0)::float8 as income,
        coalesce(sum(tx.amount)
                 filter (where tx.kind = 'expense' and tx.occurred_on >= ${from}::date), 0)::float8 as expense
      from currencies cur
      left join tx on tx.currency = cur.currency
      group by cur.currency
    ),
    categories as (
      select currency, kind, category, sum(amount)::float8 as total, count(*)::int as movements
      from in_range
      group by currency, kind, category
    ),
    due as (
      select distinct gs::date as fee_month
      from ${periods} ${p}
      cross join lateral generate_series(
        date_trunc('month', greatest(${p.startsOn}, ${from}::date)),
        date_trunc('month', least(${p.endsOn}, ${to}::date, current_date)),
        interval '1 month'
      ) gs
      where ${p.startsOn} <= ${to}::date and ${p.endsOn} >= ${from}::date
    ),
    house_status as (
      select
        ${pr.number},
        coalesce(array_agg(d.fee_month order by d.fee_month) filter (where paid.id is null), '{}'::date[]) as unpaid
      from ${properties} ${pr}
      cross join due d
      left join lateral (
        select ${t.id}
        from ${transactions} ${t}
        where ${t.propertyId} = ${pr.id}
          and ${t.feeMonth} = d.fee_month
          and ${t.categoryId} = (select id from fee_category)
          and ${t.deletedAt} is null
          and ${t.occurredOn} <= ${to}::date
        limit 1
      ) paid on true
      where ${pr.deletedAt} is null
      group by ${pr.id}, ${pr.number}
    ),
    advance as (
      select ${pr.number}, array_agg(distinct ${t.feeMonth} order by ${t.feeMonth}) as months
      from ${transactions} ${t}
      join ${properties} ${pr} on ${pr.id} = ${t.propertyId}
      where ${t.categoryId} = (select id from fee_category)
        and ${t.deletedAt} is null
        and ${t.occurredOn} <= ${to}::date
        and ${t.feeMonth} > date_trunc('month', ${to}::date)
        and ${pr.deletedAt} is null
      group by ${pr.id}, ${pr.number}
    )
    select jsonb_build_object(
      'from', ${from}::date,
      'to', ${to}::date,
      'currencies', (
        select jsonb_agg(jsonb_build_object(
          'currency', tot.currency,
          'openingBalance', tot.opening,
          'totalIncome', tot.income,
          'totalExpense', tot.expense,
          'closingBalance', round((tot.opening + tot.income - tot.expense)::numeric, 2)::float8,
          'categories', coalesce((
            select jsonb_agg(jsonb_build_object(
              'kind', cat.kind, 'name', cat.category, 'total', cat.total, 'movements', cat.movements
            ) order by cat.kind, cat.total desc, cat.category)
            from categories cat
            where cat.currency = tot.currency
          ), '[]'::jsonb)
        ) order by tot.currency is distinct from (select ${s.currency} from ${settings} ${s}), tot.currency)
        from totals tot
      ),
      'feeStatus', jsonb_build_object(
        'months', (select count(*) from due),
        'houses', (select count(*) from house_status),
        'upToDate', (select count(*) from house_status where unpaid = '{}'),
        'pending', coalesce((
          select jsonb_agg(jsonb_build_object('house', hs.number, 'months', to_jsonb(hs.unpaid)) order by hs.number)
          from house_status hs
          where hs.unpaid <> '{}'
        ), '[]'::jsonb),
        'advance', coalesce((
          select jsonb_agg(jsonb_build_object('house', a.number, 'months', to_jsonb(a.months)) order by a.number)
          from advance a
        ), '[]'::jsonb)
      )
    ) as report
  `)
  return result.rows[0].report
}
