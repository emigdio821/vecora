import { queryOptions } from '@tanstack/react-query'
import {
  fetchCategories,
  fetchHouseFeeStatus,
  fetchPeriodMovements,
  fetchPeriodSummaries,
  fetchTransactions,
} from '@/server-actions/treasury'

export const TREASURY_QUERY_KEY = 'treasury'

export type TransactionQueryData = Awaited<ReturnType<typeof fetchTransactions>>[number]

export const transactionsListQueryOptions = queryOptions({
  queryKey: [TREASURY_QUERY_KEY, 'transactions'],
  queryFn: () => fetchTransactions(),
})

/** How many movements point at a period or category, soft-deleted ones included; deletable only at 0. */
export function transactionCount(row: { transactionCount: number }) {
  return row.transactionCount
}

export type PeriodSummaryQueryData = Awaited<ReturnType<typeof fetchPeriodSummaries>>[number]

export const periodSummariesQueryOptions = queryOptions({
  queryKey: [TREASURY_QUERY_KEY, 'period-summaries'],
  queryFn: () => fetchPeriodSummaries(),
})

export type PeriodMovementQueryData = Awaited<ReturnType<typeof fetchPeriodMovements>>[number]

export function periodMovementsQueryOptions(periodId: string) {
  return queryOptions({
    queryKey: [TREASURY_QUERY_KEY, 'period-movements', periodId],
    queryFn: () => fetchPeriodMovements(periodId),
  })
}

export type HouseFeeStatusQueryData = Awaited<ReturnType<typeof fetchHouseFeeStatus>>[number]

export const houseFeeStatusQueryOptions = queryOptions({
  queryKey: [TREASURY_QUERY_KEY, 'fee-status'],
  queryFn: () => fetchHouseFeeStatus(),
})

export type CategoryQueryData = Awaited<ReturnType<typeof fetchCategories>>[number]

export const categoriesQueryOptions = queryOptions({
  queryKey: [TREASURY_QUERY_KEY, 'categories'],
  queryFn: () => fetchCategories(),
})
