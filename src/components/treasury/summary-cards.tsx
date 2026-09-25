'use client'

import { useQuery } from '@tanstack/react-query'
import { format, startOfMonth } from 'date-fns'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatMonth } from '@/lib/utils'
import {
  periodSummariesQueryOptions,
  periodsQueryOptions,
  transactionsListQueryOptions,
} from '@/tanstack-queries/treasury'

export function TreasurySummaryCards() {
  const periods = useQuery(periodsQueryOptions())
  const summaries = useQuery(periodSummariesQueryOptions())
  const transactions = useQuery(transactionsListQueryOptions())

  if (periods.isPending || summaries.isPending || transactions.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-22 rounded-xl" />
        <Skeleton className="h-22 rounded-xl" />
        <Skeleton className="h-22 rounded-xl" />
      </div>
    )
  }

  if (periods.isError || summaries.isError || transactions.isError) return null

  const today = format(new Date(), 'yyyy-MM-dd')
  // The period that contains today; falls back to the newest one between boards.
  const period = periods.data.find((p) => p.starts_on <= today && today <= p.ends_on) ?? periods.data[0]
  const balance = summaries.data.find((s) => s.period_id === period?.id)?.balance

  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const thisMonth = transactions.data.filter((t) => t.occurred_on >= monthStart)
  const sum = (kind: 'income' | 'expense') =>
    thisMonth.filter((t) => t.kind === kind).reduce((total, t) => total + Number(t.amount), 0)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>{period ? `Saldo · periodo ${period.name}` : 'Saldo'}</CardDescription>
          <CardTitle className="text-2xl tabular-nums">
            {balance != null ? formatCurrency(balance) : ''}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Ingresos · {formatMonth(monthStart)}</CardDescription>
          <CardTitle className="text-2xl text-success-foreground tabular-nums">
            {formatCurrency(sum('income'))}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Egresos · {formatMonth(monthStart)}</CardDescription>
          <CardTitle className="text-2xl text-destructive-foreground tabular-nums">
            {formatCurrency(sum('expense'))}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}
