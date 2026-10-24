import { ParaglideMessage } from '@inlang/paraglide-js-react'
import { IconCalendarOff, IconChartArea, IconChartAreaLine } from '@tabler/icons-react'
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
import { type ReactNode, useMemo, useState } from 'react'
import { DashboardCardError } from '@/components/dashboard/card-error'
import { messageMarkup } from '@/components/shared/message-markup'
import { Money } from '@/components/shared/money'
import { CardFrameSkeleton } from '@/components/shared/skeletons/card-frame'
import { Badge } from '@/components/ui/badge'
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
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useFormatCurrency } from '@/hooks/use-currency'
import { useToday } from '@/hooks/use-today'
import { periodFor } from '@/lib/periods'
import { type CurrencyCode, cn, dateLocale, ISO_DAY, intlLocale } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { type PeriodQueryData, periodsQueryOptions } from '@/tanstack-queries/presidency'
import {
  type PeriodMovementQueryData,
  type PeriodSummaryQueryData,
  periodMovementsQueryOptions,
  periodSummariesQueryOptions,
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

const CHART_HEIGHT = 200

// Same green/red as the swatches in the totals; the tokens live in globals.css.
const SERIES_COLORS = scaleOrdinal<Series, string>(
  ['income', 'expense'],
  ['var(--chart-income)', 'var(--chart-expense)'],
)

// Monotone, so the rounding never dips below $0 or overshoots a month's real total.
const CURVE = d3Curve(curveMonotoneX)

// Lines and areas grow from $0 on first paint and morph when the data changes; the
// tooltip and crosshair follow the same spring. `initial: 'always'` replays the entrance
// on the server-rendered chart too. Damping 26 settles without overshoot, so the lines
// never pass the real totals. Snaps when the device asks for reduced motion.
const RENDERER = motion({
  initial: 'always',
  transition: { type: 'spring', stiffness: 170, damping: 26, mass: 1 },
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
 * no gaps. A period that hasn't started yet shows all of its months.
 */
function monthlyTotals(period: PeriodQueryData, movements: PeriodMovementQueryData[], today: string) {
  const last = movements.reduce((max, m) => (m.occurredOn > max ? m.occurredOn : max), today)
  const shownThrough = last < period.endsOn ? last : period.endsOn
  // Before the period starts, today would end the axis ahead of its first month.
  const end = shownThrough < period.startsOn ? period.endsOn : shownThrough
  const totals = new Map<string, MonthTotals>(
    eachMonthOfInterval({ start: parseISO(period.startsOn), end: parseISO(end) }).map((d) => {
      const month = format(d, 'yyyy-MM')
      return [month, { month, income: 0, expense: 0 }]
    }),
  )

  for (const m of movements) {
    const month = totals.get(m.occurredOn.slice(0, 7))
    if (month) month[m.kind] += m.amount
  }

  return [...totals.values()]
}

/**
 * Income, expenses and balance of a period, and how they moved month by month.
 * The period that contains today, unless the board picks another one.
 */
export function TreasuryCard() {
  const periods = useQuery(periodsQueryOptions)
  const summaries = useQuery(periodSummariesQueryOptions)
  const now = useToday()
  // null until the board picks one: the card follows the current period.
  const [pickedId, setPickedId] = useState<string | null>(null)

  if (periods.isPending || summaries.isPending) return <TreasuryCardSkeleton />
  if (periods.isError || summaries.isError) {
    return (
      <DashboardCardError
        title={m.common_section_treasury()}
        description={m.dashboard_treasury_summary()}
        icon={IconChartArea}
        spacer={<TreasuryCardSkeletonContent />}
        onRetry={() => {
          void periods.refetch()
          void summaries.refetch()
        }}
      />
    )
  }

  const today = format(now, ISO_DAY)
  const current = periodFor(periods.data, today)
  // Back to the current one if the picked period was deleted meanwhile.
  const period = periods.data.find((p) => p.id === pickedId) ?? current
  // The period's own currency first, then any other it has movements in.
  const periodSummaries = summaries.data
    .filter((s) => s.periodId === period?.id)
    .sort((a, b) => Number(b.currency === period?.currency) - Number(a.currency === period?.currency))

  // Only when picking would change something: there's a period besides the one shown.
  const hasOtherPeriods = periods.data.some((p) => p.id !== period?.id)
  const picker = hasOtherPeriods ? (
    <PeriodPicker
      periods={periods.data}
      value={period?.id ?? null}
      currentId={current?.id}
      onValueChange={setPickedId}
    />
  ) : null

  if (!period || periodSummaries.length === 0) {
    return (
      <CardFrame className="w-full">
        <CardFrameHeader>
          <CardFrameTitle>{m.common_section_treasury()}</CardFrameTitle>
          <CardFrameDescription>{m.dashboard_treasury_summary()}</CardFrameDescription>
          <TreasuryCardAction picker={picker} />
        </CardFrameHeader>
        <Card>
          {/* The skeleton's totals and chart, unseen, hold the space; the empty state sits
              centered on them, so the card is as tall as the skeleton was. */}
          <CardPanel className="grid">
            <div aria-hidden className="invisible col-start-1 row-start-1">
              <TreasuryCardSkeletonContent />
            </div>
            <Empty className="col-start-1 row-start-1 py-0 md:py-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconCalendarOff />
                </EmptyMedia>
                <EmptyTitle>{m.dashboard_no_current_period()}</EmptyTitle>
                <EmptyDescription>
                  <ParaglideMessage
                    markup={messageMarkup}
                    message={m.dashboard_treasury_no_period_description}
                  />
                </EmptyDescription>
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

  return <PeriodTreasury period={period} summaries={periodSummaries} today={today} picker={picker} />
}

/** The period picker when there is one; otherwise the section's icon. */
function TreasuryCardAction({ picker }: { picker: ReactNode }) {
  if (picker) {
    return <CardFrameAction>{picker}</CardFrameAction>
  }

  return (
    <CardFrameAction className="text-muted-foreground">
      <IconChartArea />
    </CardFrameAction>
  )
}

/** Newest first, as the periods come; the one that contains today is marked. */
function PeriodPicker({
  periods,
  value,
  currentId,
  onValueChange,
}: {
  periods: PeriodQueryData[]
  value: string | null
  currentId: string | undefined
  onValueChange: (id: string) => void
}) {
  const items = periods.map((p) => ({ value: p.id, label: p.name }))

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(id) => {
        if (id) onValueChange(id)
      }}
    >
      <SelectTrigger
        size="sm"
        className="w-auto max-w-48 min-w-28"
        aria-label={m.dashboard_treasury_period_picker()}
      >
        <SelectValue placeholder={m.dashboard_treasury_period_picker_placeholder()} />
      </SelectTrigger>
      <SelectPopup align="end">
        {periods.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <span className="flex items-center gap-2">
              {p.name}
              {p.id === currentId && (
                <Badge variant="info" size="sm">
                  {m.dashboard_treasury_period_current()}
                </Badge>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

/** Same layout as PeriodTreasury (totals, then the chart), so nothing moves when the data lands. */
function TreasuryCardSkeleton() {
  return (
    <CardFrameSkeleton className="w-full">
      <CardPanel>
        <TreasuryCardSkeletonContent />
      </CardPanel>
    </CardFrameSkeleton>
  )
}

function TreasuryCardSkeletonContent() {
  return (
    <div className="grid min-w-0 gap-6">
      <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-2 sm:grid sm:gap-1">
            {/* Boxes as tall as the real lines: text-sm label, text-base / sm:text-xl value. */}
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-16" />
            </div>
            <div className="flex h-6 items-center sm:h-7">
              <Skeleton className="h-4 w-24 sm:h-5 sm:w-28" />
            </div>
          </div>
        ))}
      </div>
      <Skeleton style={{ height: CHART_HEIGHT }} />
    </div>
  )
}

/** Totals and chart in the leading currency; other currencies get a line each underneath. */
function PeriodTreasury({
  period,
  summaries,
  today,
  picker,
}: {
  period: PeriodQueryData
  summaries: PeriodSummaryQueryData[]
  today: string
  picker: ReactNode
}) {
  const [summary, ...others] = summaries
  const { currency, balance } = summary
  const formatCurrency = useFormatCurrency()

  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>{m.common_section_treasury()}</CardFrameTitle>
        <CardFrameDescription>{m.dashboard_treasury_period_name({ name: period.name })}</CardFrameDescription>
        <TreasuryCardAction picker={picker} />
      </CardFrameHeader>
      <Card>
        <CardPanel className="grid min-w-0 gap-6">
          <dl className="grid gap-2 sm:grid-cols-3 sm:gap-4">
            <Total
              label={m.common_income()}
              swatch="bg-(--chart-income)"
              value={summary.totalIncome}
              currency={currency}
            />
            <Total
              label={m.common_expense()}
              swatch="bg-(--chart-expense)"
              value={summary.totalExpense}
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
                const code = other.currency
                return (
                  <li key={code}>
                    {m.dashboard_treasury_other_currency({
                      code,
                      income: formatCurrency(other.totalIncome, code),
                      expense: formatCurrency(other.totalExpense, code),
                      balance: formatCurrency(other.balance, code),
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
      <dd className={cn('text-base font-semibold tabular-nums sm:text-xl', className)}>
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
  if (movements.isError) {
    return (
      <div
        style={{ height: CHART_HEIGHT }}
        className="flex flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground"
      >
        {m.common_load_failed_description()}
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            void movements.refetch()
          }}
        >
          {m.common_action_retry()}
        </Button>
      </div>
    )
  }

  // A new period, say: a flat line at $0 would look like the chart failed to draw.
  // At least the chart's height; on phones the wrapped text needs more.
  if (!movements.data.some((m) => m.currency === currency)) {
    return (
      <Empty style={{ minHeight: CHART_HEIGHT }} className="py-0 md:py-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconChartAreaLine />
          </EmptyMedia>
          <EmptyTitle>{m.dashboard_treasury_no_movements()}</EmptyTitle>
          <EmptyDescription>
            <ParaglideMessage
              markup={messageMarkup}
              message={m.dashboard_treasury_no_movements_description}
            />
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" render={<Link to="/treasury" />}>
            {m.dashboard_treasury_go_to_treasury()}
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

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
