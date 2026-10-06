import { IconCalendarOff, IconChartArea } from '@tabler/icons-react'
import { areaY, d3Curve, defineChart, lineY } from '@tanstack/charts'
import { crosshair } from '@tanstack/charts/crosshair'
import { decorative } from '@tanstack/charts/mark/decorative'
import { motion } from '@tanstack/charts/motion'
// The /core entry takes a renderer; the default one is static SVG.
import { Chart } from '@tanstack/charts/react/core'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { scaleOrdinal } from '@tanstack/charts/scales/ordinal'
import { scalePoint } from '@tanstack/charts/scales/point'
import { tooltip } from '@tanstack/charts/tooltip'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { curveMonotoneX } from 'd3-shape'
import { eachMonthOfInterval, format, parseISO } from 'date-fns'
import { useMemo } from 'react'
import { Money } from '@/components/shared/money'
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
import { useFormatCurrency } from '@/hooks/use-currency'
import { useToday } from '@/hooks/use-today'
import { type CurrencyCode, cn, dateLocale, ISO_DAY, intlLocale } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import {
  type PeriodMovementQueryData,
  type PeriodQueryData,
  type PeriodSummaryQueryData,
  periodMovementsQueryOptions,
  periodSummariesQueryOptions,
  periodsQueryOptions,
} from '@/tanstack-queries/treasury'

type Series = 'income' | 'expense'

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
  ['income', 'expense'],
  ['var(--chart-income)', 'var(--chart-expense)'],
)

// Monotone, so the rounding never dips below $0 or overshoots a month's real total.
const CURVE = d3Curve(curveMonotoneX)

// Lines and areas grow from $0 on first paint and morph when the data changes; the
// tooltip and crosshair follow the same spring. `initial: 'always'` replays the entrance
// on the server-rendered chart too. Snaps under reduced motion.
const RENDERER = motion({
  initial: 'always',
  transition: { type: 'spring', stiffness: 170, damping: 18, mass: 1 },
})

function seriesLabel(series: string) {
  return series === 'income' ? m.common_income() : m.common_expense()
}

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

  if (periods.isPending || summaries.isPending) return <TreasuryCardSkeleton />
  if (periods.isError || summaries.isError) return null

  const today = format(now, ISO_DAY)
  const period = periods.data.find((p) => p.starts_on <= today && today <= p.ends_on)
  // The period's own currency first, then any other it has movements in.
  const periodSummaries = summaries.data
    .filter((s) => s.period_id === period?.id)
    .sort((a, b) => Number(b.currency === period?.currency) - Number(a.currency === period?.currency))

  if (!period || periodSummaries.length === 0) {
    return (
      <CardFrame className="w-full">
        <CardFrameHeader>
          <CardFrameTitle>{m.common_section_treasury()}</CardFrameTitle>
          <CardFrameDescription>{m.dashboard_treasury_summary()}</CardFrameDescription>
        </CardFrameHeader>
        <Card>
          <CardPanel>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconCalendarOff />
                </EmptyMedia>
                <EmptyTitle>{m.dashboard_no_current_period()}</EmptyTitle>
                <EmptyDescription>{m.dashboard_treasury_no_period_description()}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" render={<Link to="/presidency" search={{ tab: 'periods' }} />}>
                  {m.dashboard_treasury_go_to_periods()}
                </Button>
              </EmptyContent>
            </Empty>
          </CardPanel>
        </Card>
      </CardFrame>
    )
  }

  return <PeriodTreasury period={period} summaries={periodSummaries} today={today} />
}

/** Same layout as PeriodTreasury (totals, then the chart), so nothing moves when the data lands. */
function TreasuryCardSkeleton() {
  return (
    <CardFrameSkeleton className="w-full">
      <CardPanel className="grid min-w-0 gap-6">
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-2 sm:grid sm:gap-1">
              {/* Boxes as tall as the real lines: text-sm label, text-base / sm:text-2xl value. */}
              <div className="flex h-5 items-center">
                <Skeleton className="h-3.5 w-16" />
              </div>
              <div className="flex h-6 items-center sm:h-8">
                <Skeleton className="h-4 w-24 sm:h-6 sm:w-32" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton style={{ height: CHART_HEIGHT }} />
      </CardPanel>
    </CardFrameSkeleton>
  )
}

/** Totals and chart in the leading currency; other currencies get a line each underneath. */
function PeriodTreasury({
  period,
  summaries,
  today,
}: {
  period: PeriodQueryData
  summaries: PeriodSummaryQueryData[]
  today: string
}) {
  const [summary, ...others] = summaries
  const currency = summary.currency ?? period.currency
  const balance = Number(summary.balance ?? 0)
  const formatCurrency = useFormatCurrency()

  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>{m.common_section_treasury()}</CardFrameTitle>
        <CardFrameDescription>{m.dashboard_treasury_period_name({ name: period.name })}</CardFrameDescription>
        <CardFrameAction className="text-muted-foreground">
          <IconChartArea />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className="grid min-w-0 gap-6">
          <dl className="grid gap-2 sm:grid-cols-3 sm:gap-4">
            <Total
              label={m.common_income()}
              swatch="bg-(--chart-income)"
              value={summary.total_income ?? 0}
              currency={currency}
            />
            <Total
              label={m.common_expense()}
              swatch="bg-(--chart-expense)"
              value={summary.total_expense ?? 0}
              currency={currency}
            />
            <Total
              label={m.common_balance()}
              value={balance}
              currency={currency}
              className={balance < 0 ? 'text-destructive-foreground' : undefined}
            />
          </dl>
          {others.length > 0 && (
            <ul className="grid gap-1 text-sm text-muted-foreground tabular-nums">
              {others.map((other) => {
                const code = other.currency ?? period.currency
                return (
                  <li key={code}>
                    {m.dashboard_treasury_other_currency({
                      code,
                      income: formatCurrency(other.total_income ?? 0, code),
                      expense: formatCurrency(other.total_expense ?? 0, code),
                      balance: formatCurrency(other.balance ?? 0, code),
                    })}
                  </li>
                )
              })}
            </ul>
          )}
          <MonthlyFlowChart period={period} currency={currency} today={today} />
        </CardPanel>
      </Card>
    </CardFrame>
  )
}

function Total({
  label,
  swatch,
  value,
  currency,
  className,
}: {
  label: string
  swatch?: string
  value: number | string
  currency: CurrencyCode
  className?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 sm:grid sm:gap-1">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        {swatch && <span aria-hidden className={cn('h-0.5 w-3 rounded-full', swatch)} />}
        {label}
      </dt>
      <dd className={cn('text-base font-semibold tabular-nums sm:text-2xl', className)}>
        <Money value={value} currency={currency} />
      </dd>
    </div>
  )
}

function MonthlyFlowChart({
  period,
  currency,
  today,
}: {
  period: PeriodQueryData
  currency: CurrencyCode
  today: string
}) {
  const movements = useQuery(periodMovementsQueryOptions(period.id))
  const formatCurrency = useFormatCurrency()

  // Amounts in different currencies don't add up, so the chart sticks to one.
  const months = useMemo(
    () =>
      movements.data
        ? monthlyTotals(
            period,
            movements.data.filter((m) => m.currency === currency),
            today,
          )
        : [],
    [period, currency, movements.data, today],
  )
  const rows = useMemo(
    () =>
      months.flatMap((t): FlowRow[] => [
        { month: t.month, series: 'income', amount: t.income },
        { month: t.month, series: 'expense', amount: t.expense },
      ]),
    [months],
  )

  const definition = useMemo(() => {
    const compactCurrency = new Intl.NumberFormat(intlLocale(), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      notation: 'compact',
      maximumFractionDigits: 1,
    })

    return defineChart({
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
            ticks: { size: 0, format: (month) => format(monthDate(month), 'MMM', { locale: dateLocale() }) },
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
          title: format(monthDate(String(points[0]?.xValue ?? '')), 'MMMM yyyy', { locale: dateLocale() }),
          rows: points.map((point) => ({
            label: seriesLabel(String(point.groupLabel)),
            value: formatCurrency(point.datum.amount, currency),
            color: point.color,
          })),
        }),
      },
    })
  }, [rows, currency, formatCurrency])

  if (movements.isPending) return <Skeleton style={{ height: CHART_HEIGHT }} />
  if (movements.isError) return null

  return (
    <>
      {/* Axis text and grid paint with currentColor. */}
      <div className="text-muted-foreground">
        <Chart
          definition={definition}
          renderer={RENDERER}
          height={CHART_HEIGHT}
          ariaLabel={m.dashboard_treasury_chart_label({ name: period.name })}
          ariaDescription={m.dashboard_treasury_chart_description()}
        />
      </div>
      {/* sr-only on the wrapper: a table ignores its 1px width and overflow, and
          at full width it made the page scroll sideways on phones. */}
      <div className="sr-only">
        <table>
          <caption>{m.dashboard_treasury_chart_label({ name: period.name })}</caption>
          <thead>
            <tr>
              <th scope="col">{m.dashboard_treasury_month()}</th>
              <th scope="col">{m.common_income()}</th>
              <th scope="col">{m.common_expense()}</th>
            </tr>
          </thead>
          <tbody>
            {months.map((t) => (
              <tr key={t.month}>
                <th scope="row">{format(monthDate(t.month), 'MMMM yyyy', { locale: dateLocale() })}</th>
                <td>{formatCurrency(t.income, currency)}</td>
                <td>{formatCurrency(t.expense, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
