'use client'

import { areaY, d3Curve, defineChart, lineY } from '@tanstack/charts'
import { crosshair } from '@tanstack/charts/crosshair'
import { decorative } from '@tanstack/charts/mark/decorative'
import { Chart } from '@tanstack/charts/react'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scaleOrdinal } from '@tanstack/charts/scales/ordinal'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import { useQuery } from '@tanstack/react-query'
import { curveMonotoneX } from 'd3-shape'
import { eachMonthOfInterval, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarOffIcon, ChartAreaIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useToday } from '@/hooks/use-today'
import { cn, formatCurrency, ISO_DAY } from '@/lib/utils'
import {
  type PeriodMovementQueryData,
  type PeriodQueryData,
  type PeriodSummaryQueryData,
  periodMovementsQueryOptions,
  periodSummariesQueryOptions,
  periodsQueryOptions,
} from '@/tanstack-queries/treasury'

type Series = 'Ingresos' | 'Egresos'

interface MonthTotals {
  /** "2026-03" */
  month: string
  income: number
  expense: number
}

/** One point: a month and series. */
interface FlowRow {
  month: string
  series: Series
  amount: number
}

const CHART_HEIGHT = 240

// Same green/red as the swatches in the totals; the tokens live in globals.css.
const SERIES_COLORS = scaleOrdinal<Series, string>(
  ['Ingresos', 'Egresos'],
  ['var(--chart-income)', 'var(--chart-expense)'],
)

// Monotone, so the rounding never dips below $0 or overshoots a month's real total.
const CURVE = d3Curve(curveMonotoneX)

const compactCurrency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  notation: 'compact',
  maximumFractionDigits: 1,
})

function monthDate(month: string) {
  return parseISO(`${month}-01`)
}

/**
 * From the period's first month through today (or the last movement, if one
 * is dated later). Months without movements stay in as zeros so the axis has
 * no gaps.
 */
function monthlyTotals(period: PeriodQueryData, movements: PeriodMovementQueryData[], today: string) {
  const last = movements.reduce((max, m) => (m.occurred_on > max ? m.occurred_on : max), today)
  const end = last < period.ends_on ? last : period.ends_on
  const totals = new Map<string, MonthTotals>(
    eachMonthOfInterval({ start: parseISO(period.starts_on), end: parseISO(end) }).map((d) => {
      const month = format(d, 'yyyy-MM')
      return [month, { month, income: 0, expense: 0 }]
    }),
  )

  for (const m of movements) {
    const month = totals.get(m.occurred_on.slice(0, 7))
    if (month) month[m.kind] += Number(m.amount)
  }

  return [...totals.values()]
}

/** Income, expenses and balance of the period that contains today, and how they moved month by month. */
export function TreasuryCard() {
  const periods = useQuery(periodsQueryOptions())
  const summaries = useQuery(periodSummariesQueryOptions())
  const now = useToday()

  if (periods.isPending || summaries.isPending) return <CardFrameSkeleton />
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

  return <PeriodTreasury period={period} summary={summary} today={today} />
}

function PeriodTreasury({
  period,
  summary,
  today,
}: {
  period: PeriodQueryData
  summary: PeriodSummaryQueryData
  today: string
}) {
  const balance = Number(summary.balance ?? 0)

  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>Tesorería</CardFrameTitle>
        <CardFrameDescription>Periodo {period.name}</CardFrameDescription>
        <CardFrameAction className="text-muted-foreground">
          <ChartAreaIcon />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className="grid min-w-0 gap-6">
          {/* Also the chart's legend: the swatches name the two series. */}
          <dl className="grid grid-cols-3 gap-2 sm:gap-4">
            <Total label="Ingresos" swatch="bg-(--chart-income)" value={summary.total_income ?? 0} />
            <Total label="Egresos" swatch="bg-(--chart-expense)" value={summary.total_expense ?? 0} />
            <Total
              label="Saldo"
              value={balance}
              className={balance < 0 ? 'text-destructive-foreground' : undefined}
            />
          </dl>
          <MonthlyFlowChart period={period} today={today} />
        </CardPanel>
      </Card>
    </CardFrame>
  )
}

function Total({
  label,
  swatch,
  value,
  className,
}: {
  label: string
  swatch?: string
  value: number | string
  className?: string
}) {
  return (
    <div className="grid gap-1">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        {swatch && <span aria-hidden className={cn('h-0.5 w-3 rounded-full', swatch)} />}
        {label}
      </dt>
      <dd className={cn('text-base font-semibold tabular-nums sm:text-2xl', className)}>
        {formatCurrency(value)}
      </dd>
    </div>
  )
}

function MonthlyFlowChart({ period, today }: { period: PeriodQueryData; today: string }) {
  const movements = useQuery(periodMovementsQueryOptions(period.id))

  const months = useMemo(
    () => (movements.data ? monthlyTotals(period, movements.data, today) : []),
    [period, movements.data, today],
  )
  const rows = useMemo(
    () =>
      months.flatMap((t): FlowRow[] => [
        { month: t.month, series: 'Ingresos', amount: t.income },
        { month: t.month, series: 'Egresos', amount: t.expense },
      ]),
    [months],
  )

  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          // Explicit baseline so the two areas overlap instead of stacking.
          // Visual only: the lines own focus, so each series appears once in the tooltip.
          decorative(
            areaY(rows, { x: 'month', y1: 0, y2: 'amount', z: 'series', fillOpacity: 0.1, curve: CURVE }),
          ),
          lineY(rows, { x: 'month', y: 'amount', z: 'series', strokeWidth: 2, curve: CURVE }),
          crosshair({ y: false }),
        ],
        scales: {
          x: {
            scale: () => scalePoint<string>().padding(0.25),
            axis: {
              line: false,
              ticks: { size: 0, format: (month) => format(monthDate(month), 'MMM', { locale: es }) },
            },
          },
          y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
            axis: { line: false, ticks: { size: 0, format: (value) => compactCurrency.format(value) } },
          },
        },
        color: { scale: SERIES_COLORS },
        focus: 'group-x',
        // Anywhere over the plot snaps to the nearest month.
        maxFocusDistance: Number.POSITIVE_INFINITY,
        tooltip: {
          use: tooltip,
          anchor: 'group-center',
          placement: ['right', 'left', 'top'],
          sort: 'color-domain',
          content: (points) => ({
            title: format(monthDate(String(points[0]?.xValue ?? '')), 'MMMM yyyy', { locale: es }),
            rows: points.map((point) => ({
              label: String(point.groupLabel),
              value: formatCurrency(point.datum.amount),
              color: point.color,
            })),
          }),
        },
      }),
    [rows],
  )

  if (movements.isPending) return <Skeleton style={{ height: CHART_HEIGHT }} />
  if (movements.isError) return null

  return (
    <>
      {/* Axis text and grid paint with currentColor. */}
      <div className="text-muted-foreground">
        <Chart
          definition={definition}
          height={CHART_HEIGHT}
          ariaLabel={`Ingresos y egresos por mes, periodo ${period.name}`}
          ariaDescription="Áreas por mes: ingresos en verde y egresos en rojo. La tabla que sigue tiene los montos exactos."
        />
      </div>
      <table className="sr-only">
        <caption>Ingresos y egresos por mes, periodo {period.name}</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Ingresos</th>
            <th scope="col">Egresos</th>
          </tr>
        </thead>
        <tbody>
          {months.map((t) => (
            <tr key={t.month}>
              <th scope="row">{format(monthDate(t.month), 'MMMM yyyy', { locale: es })}</th>
              <td>{formatCurrency(t.income)}</td>
              <td>{formatCurrency(t.expense)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
