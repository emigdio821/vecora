'use client'

import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { CalendarOffIcon, TrendingDownIcon, TrendingUpIcon, PiggyBankIcon } from 'lucide-react'
import Link from 'next/link'
import { CardFrameSkeleton } from '@/components/shared/skeletons/card-frame'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useToday } from '@/hooks/use-today'
import { cn, formatCurrency, ISO_DAY } from '@/lib/utils'
import { periodSummariesQueryOptions, periodsQueryOptions } from '@/tanstack-queries/treasury'

/** Income, expenses and balance of the period that contains today. */
export function PeriodSummaryCards() {
  const periods = useQuery(periodsQueryOptions())
  const summaries = useQuery(periodSummariesQueryOptions())
  const now = useToday()

  if (periods.isPending || summaries.isPending) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <CardFrameSkeleton />
        <CardFrameSkeleton />
        <CardFrameSkeleton />
      </div>
    )
  }

  if (periods.isError || summaries.isError) return null

  const today = format(now, ISO_DAY)
  const period = periods.data.find((p) => p.starts_on <= today && today <= p.ends_on)
  const summary = period && summaries.data.find((s) => s.period_id === period.id)

  if (!period || !summary) {
    return (
      <CardFrame className="w-full">
        <CardFrameHeader>
          <CardFrameTitle>Tesorería</CardFrameTitle>
          <CardFrameDescription>Resumen del periodo</CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarOffIcon />
                </EmptyMedia>
                <EmptyTitle>Sin periodo actual</EmptyTitle>
                <EmptyDescription>
                  Ningún periodo cubre la fecha de hoy. Crea uno en "Presidencia" para ver el resumen.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" render={<Link href="/presidency?tab=periods" />}>
                  Ir a Periodos
                </Button>
              </EmptyContent>
            </Empty>
          </CardPanel>
        </Card>
      </CardFrame>
    )
  }

  const balance = Number(summary.balance ?? 0)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SummaryCard
        title="Ingresos"
        period={period.name}
        icon={<TrendingUpIcon />}
        value={summary.total_income ?? 0}
        className="text-success-foreground"
      />
      <SummaryCard
        title="Egresos"
        period={period.name}
        icon={<TrendingDownIcon />}
        value={summary.total_expense ?? 0}
        className="text-destructive-foreground"
      />
      <SummaryCard
        title="Saldo"
        period={period.name}
        icon={<PiggyBankIcon />}
        value={balance}
        className={balance < 0 ? 'text-destructive-foreground' : undefined}
      />
    </div>
  )
}

function SummaryCard({
  title,
  period,
  icon,
  value,
  className,
}: {
  title: string
  period: string
  icon: React.ReactNode
  value: number | string
  className?: string
}) {
  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>{title}</CardFrameTitle>
        <CardFrameDescription>Periodo {period}</CardFrameDescription>
        <CardFrameAction className="text-muted-foreground">{icon}</CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel>
          <p className={cn('text-2xl font-semibold tabular-nums', className)}>{formatCurrency(value)}</p>
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
