import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const TREASURY_QUERY_KEY = 'treasury'

function transactionsListQuery() {
  return (
    createClient()
      .from('transactions')
      .select(
        `
      id, kind, amount, occurred_on, fee_month, payment_method, folio, reference, description, notes,
      created_at, updated_at,
      category:transaction_categories!inner ( id, name, key ),
      period:periods!inner ( id, name ),
      property:properties ( id, number )
      `,
      )
      .is('deleted_at', null)
      // Soft-deleted houses stay attached: the money did come from them.
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false })
  )
}

export type TransactionQueryData = QueryData<ReturnType<typeof transactionsListQuery>>[number]

export function transactionsListQueryOptions() {
  return queryOptions({
    queryKey: [TREASURY_QUERY_KEY, 'transactions'],
    queryFn: async () => {
      const { data, error } = await transactionsListQuery()
      if (error) throw error
      return data
    },
  })
}

/**
 * Newest first. `transactions(count)` includes soft-deleted rows on purpose:
 * the ledger is never purged, so any row at all blocks a hard delete.
 */
function periodsQuery() {
  return createClient()
    .from('periods')
    .select('id, name, starts_on, ends_on, monthly_fee, late_fee, due_day, transactions(count)')
    .order('starts_on', { ascending: false })
}

export type PeriodQueryData = QueryData<ReturnType<typeof periodsQuery>>[number]

/** Reads the `transactions(count)` embed of a period or category row. */
export function transactionCount(row: { transactions: { count: number }[] }) {
  return row.transactions[0]?.count ?? 0
}

export function periodsQueryOptions() {
  return queryOptions({
    queryKey: [TREASURY_QUERY_KEY, 'periods'],
    queryFn: async () => {
      const { data, error } = await periodsQuery()
      if (error) throw error
      return data
    },
  })
}

/** Income / expense / balance per period, computed by the database over live rows. */
function periodSummariesQuery() {
  return createClient()
    .from('treasury_period_summary')
    .select('period_id, total_income, total_expense, balance')
}

export type PeriodSummaryQueryData = QueryData<ReturnType<typeof periodSummariesQuery>>[number]

export function periodSummariesQueryOptions() {
  return queryOptions({
    queryKey: [TREASURY_QUERY_KEY, 'period-summaries'],
    queryFn: async () => {
      const { data, error } = await periodSummariesQuery()
      if (error) throw error
      return data
    },
  })
}

/** Live movements of one period, just what the monthly chart adds up. */
function periodMovementsQuery(periodId: string) {
  return createClient()
    .from('transactions')
    .select('kind, amount, occurred_on')
    .eq('period_id', periodId)
    .is('deleted_at', null)
}

export type PeriodMovementQueryData = QueryData<ReturnType<typeof periodMovementsQuery>>[number]

export function periodMovementsQueryOptions(periodId: string) {
  return queryOptions({
    queryKey: [TREASURY_QUERY_KEY, 'period-movements', periodId],
    queryFn: async () => {
      const { data, error } = await periodMovementsQuery(periodId)
      if (error) throw error
      return data
    },
  })
}

/**
 * Per live house, fee months due vs paid in the current period (DB view).
 * Empty when no period covers today.
 */
function houseFeeStatusQuery() {
  return createClient()
    .from('house_fee_status')
    .select('property_id, number, period_id, months_due, months_paid, unpaid_months')
}

export type HouseFeeStatusQueryData = QueryData<ReturnType<typeof houseFeeStatusQuery>>[number]

export function houseFeeStatusQueryOptions() {
  return queryOptions({
    queryKey: [TREASURY_QUERY_KEY, 'fee-status'],
    queryFn: async () => {
      const { data, error } = await houseFeeStatusQuery()
      if (error) throw error
      // Numeric-aware so "2" sorts before "10" (Postgres would sort them as text).
      return data.sort((a, b) => (a.number ?? '').localeCompare(b.number ?? '', 'es', { numeric: true }))
    },
  })
}

/** See periodsQuery for why the count includes soft-deleted movements. */
function categoriesQuery() {
  return createClient()
    .from('transaction_categories')
    .select('id, kind, name, key, is_active, transactions(count)')
    .order('kind')
    .order('name')
}

export type CategoryQueryData = QueryData<ReturnType<typeof categoriesQuery>>[number]

export function categoriesQueryOptions() {
  return queryOptions({
    queryKey: [TREASURY_QUERY_KEY, 'categories'],
    queryFn: async () => {
      const { data, error } = await categoriesQuery()
      if (error) throw error
      return data
    },
  })
}
