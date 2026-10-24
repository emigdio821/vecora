import { ParaglideMessage } from '@inlang/paraglide-js-react'
import {
  IconCalendar,
  IconCalendarEvent,
  IconCalendarMonth,
  IconDownload,
  IconFileDescription,
  IconHomeDollar,
  IconScale,
  IconSelector,
  IconTrendingDown,
  IconTrendingUp,
  type TablerIcon,
} from '@tabler/icons-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfYear,
  subMonths,
  subYears,
} from 'date-fns'
import { useId, useMemo, useState } from 'react'
import { messageMarkup } from '@/components/shared/message-markup'
import { NoPeriodsEmpty } from '@/components/shared/no-periods-empty'
import { type DayRange, RangePicker, type RangePreset, toRange } from '@/components/shared/range-picker'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectButton,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toastManager } from '@/components/ui/toast'
import { useToday } from '@/hooks/use-today'
import { overlapsPeriod, periodFor, reportableMonths } from '@/lib/periods'
import { formatMonth, ISO_DAY } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { periodsQueryOptions } from '@/tanstack-queries/presidency'

/** How far back the monthly picker goes when the periods fail to load. */
const MONTHS_BACK = 24

function monthRange(month: Date): DayRange {
  return toRange(startOfMonth(month), endOfMonth(month))
}

/** The last MONTHS_BACK months, newest first: the fallback without periods to go by. */
function lastMonths(today: Date): string[] {
  return Array.from({ length: MONTHS_BACK }, (_, i) => format(startOfMonth(subMonths(today, i)), ISO_DAY))
}

/** The picker's items; the running month is marked as such. */
function monthItems(months: string[], today: Date): { value: string; label: string }[] {
  const current = format(startOfMonth(today), ISO_DAY)
  return months.map((value) => {
    const label = formatMonth(value)
    return { value, label: value === current ? m.reports_month_in_progress({ month: label }) : label }
  })
}

/**
 * The months worth a report: those a period touches, up to today (see
 * reportableMonths). Undefined while the periods load; if they fail, the
 * last MONTHS_BACK months, and the PDF route still answers for any of them.
 */
function useReportMonths(today: Date): string[] | undefined {
  const { data: periods, isError } = useQuery(periodsQueryOptions)
  return useMemo(() => {
    if (periods) return reportableMonths(periods, format(today, ISO_DAY))
    if (isError) return lastMonths(today)
    return undefined
  }, [periods, isError, today])
}

interface NoReportDatesPickerProps {
  /** The field's label is `${id}-label`. */
  id: string
  /** The range picker's look (calendar icon, outline button); the month select's otherwise. */
  range?: boolean
}

/**
 * Stands in for a date picker once the periods are in and none has started:
 * the card stays, and opening the field says why there's nothing to pick.
 */
function NoReportDatesPicker({ id, range = false }: NoReportDatesPickerProps) {
  const valueId = `${id}-value`

  return (
    <Popover>
      <PopoverTrigger
        id={id}
        aria-labelledby={`${id}-label ${valueId}`}
        render={
          range ? (
            <Button variant="outline" className="w-full pr-2 font-normal" />
          ) : (
            <SelectButton className="w-full" data-placeholder="" />
          )
        }
      >
        {range ? (
          <>
            <IconCalendar aria-hidden="true" />
            <span id={valueId} className="flex-1 truncate text-start text-muted-foreground">
              {m.reports_no_dates_placeholder()}
            </span>
            <IconSelector className="pointer-events-none size-4" />
          </>
        ) : (
          <span id={valueId}>{m.reports_no_dates_placeholder()}</span>
        )}
      </PopoverTrigger>
      <PopoverPopup>
        <NoPeriodsEmpty
          title={m.reports_no_dates_title()}
          description={<ParaglideMessage markup={messageMarkup} message={m.reports_no_dates_description} />}
        />
      </PopoverPopup>
    </Popover>
  )
}

const REPORT_PRESETS: RangePreset[] = [
  {
    get label() {
      return m.reports_preset_this_month()
    },
    range: (today) => monthRange(today),
  },
  {
    get label() {
      return m.reports_preset_last_month()
    },
    range: (today) => monthRange(subMonths(today, 1)),
  },
  {
    get label() {
      return m.reports_preset_last_3_months()
    },
    range: (today) => toRange(startOfMonth(subMonths(today, 2)), today),
  },
  {
    get label() {
      return m.reports_preset_this_year()
    },
    range: (today) => toRange(startOfYear(today), today),
  },
  {
    get label() {
      return m.reports_preset_last_year()
    },
    range: (today) => toRange(startOfYear(subYears(today, 1)), endOfYear(subYears(today, 1))),
  },
]

/**
 * The route answers with the PDF as an attachment. Going through fetch (not a
 * plain link) lets us show a spinner and turn failures into a toast.
 */
async function downloadReport({ range, includeAdvance }: { range: DayRange; includeAdvance: boolean }) {
  const params = new URLSearchParams({ from: range.from, to: range.to })
  // The route includes them unless told otherwise.
  if (!includeAdvance) params.set('advance', '0')
  const response = await fetch(`/reports/pdf?${params}`)
  // Signed out, the proxy redirects to the login page, which is a 200 in HTML.
  const isPdf = response.headers.get('Content-Type') === 'application/pdf'
  if (!response.ok || !isPdf) {
    const body: { error?: string } | null = await response.json().catch(() => null)
    throw new Error(body?.error ?? m.reports_download_failed())
  }

  const disposition = response.headers.get('Content-Disposition') ?? ''
  const fileName = /filename="(.+)"/.exec(disposition)?.[1] ?? m.reports_default_file_name()
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  // Give the browser a moment to start the download before freeing the file.
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

/** Each card has its own, so only the one clicked shows as busy. Disabled without a range. */
function DownloadReportButton({
  range,
  includeAdvance,
}: {
  range: DayRange | null
  includeAdvance: boolean
}) {
  const mutation = useMutation({
    mutationFn: downloadReport,
    onSuccess: () => {
      toastManager.add({ type: 'success', title: m.reports_downloaded() })
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.common_error(), description: error.message })
    },
  })

  return (
    <Button
      loading={mutation.isPending}
      disabled={mutation.isPending || range === null}
      onClick={() => {
        if (range) mutation.mutate({ range, includeAdvance })
      }}
    >
      <IconDownload />
      {m.reports_download_pdf()}
    </Button>
  )
}

interface ReportCardProps {
  title: string
  description: string
  icon: TablerIcon
  /** The date field; the download button goes next to it. */
  children: React.ReactNode
  /** Null while there's nothing to pick yet (the periods are loading). */
  range: DayRange | null
  includeAdvance: boolean
}

function ReportCard({ title, description, icon: Icon, children, range, includeAdvance }: ReportCardProps) {
  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>{title}</CardFrameTitle>
        <CardFrameDescription>{description}</CardFrameDescription>
        <CardFrameAction>
          <Icon className="text-muted-foreground" />
        </CardFrameAction>
      </CardFrameHeader>
      {/*
       * flex-1: side by side, the shorter card still lines up with the other. The field and
       * the button share a row only when the card itself is wide enough, whatever the screen.
       */}
      <Card className="@container flex-1">
        <CardPanel className="flex flex-col gap-3 @md:flex-row @md:items-end">
          {children}
          <DownloadReportButton range={range} includeAdvance={includeAdvance} />
        </CardPanel>
      </Card>
    </CardFrame>
  )
}

/** Options of the PDF, picked once in the contents card and used by every download button. */
interface ReportOptions {
  includeAdvance: boolean
}

/**
 * A whole month, from the ones a period touches. Last month by default, the one
 * usually reported, or the newest there is when no period covers last month.
 */
export function MonthlyReportCard({ includeAdvance }: ReportOptions) {
  const today = useToday()
  const pickerId = useId()
  const months = useReportMonths(today)
  const items = useMemo(() => monthItems(months ?? [], today), [months, today])
  const hasNoDates = months?.length === 0
  const [picked, setPicked] = useState<string | null>(null)

  let month = picked
  if (month === null && months) {
    const lastMonth = format(startOfMonth(subMonths(today, 1)), ISO_DAY)
    month = months.includes(lastMonth) ? lastMonth : (months[0] ?? null)
  }

  return (
    <ReportCard
      title={m.reports_monthly_title()}
      description={m.reports_month_description()}
      icon={IconCalendarMonth}
      // No month while loading, or when no period has started: the download waits.
      range={month ? monthRange(parseISO(month)) : null}
      includeAdvance={includeAdvance}
    >
      <Field className="min-w-0 @md:flex-1">
        <FieldLabel
          id={`${pickerId}-label`}
          // The Select registers itself with the field; the stand-in doesn't, so point at it here.
          {...(hasNoDates ? { htmlFor: pickerId } : {})}
        >
          {m.reports_month_label()}
        </FieldLabel>
        {hasNoDates ? (
          <NoReportDatesPicker id={pickerId} />
        ) : (
          <Select
            items={items}
            value={month}
            disabled={months === undefined}
            onValueChange={(value) => {
              if (value) setPicked(value)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={m.common_loading()} />
            </SelectTrigger>
            <SelectPopup>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        )}
      </Field>
    </ReportCard>
  )
}

/** The latest periods get a preset each; older ones are a few clicks away in the calendar. */
const PERIOD_PRESETS = 3

/**
 * Any range of days, from one day to several years. Both ends must fall in a
 * period; the range itself may span a gap between two of them.
 */
export function CustomReportCard({ includeAdvance }: ReportOptions) {
  const today = useToday()
  const pickerId = useId()
  const { data: periods, isPending } = useQuery(periodsQueryOptions)
  const [picked, setPicked] = useState<DayRange | null>(null)

  // Undefined while loading (or failed); empty when no period has started yet.
  const months = useMemo(
    () => (periods ? reportableMonths(periods, format(today, ISO_DAY)) : undefined),
    [periods, today],
  )
  const hasNoDates = months?.length === 0

  // This month so far, or the newest month a period covers when none covers this one.
  const defaultRange = useMemo(() => {
    const thisMonth = toRange(startOfMonth(today), today)
    if (!periods || overlapsPeriod(periods, thisMonth.from, thisMonth.to)) return thisMonth
    const newest = months?.[0]
    return newest ? monthRange(parseISO(newest)) : thisMonth
  }, [periods, months, today])
  const range = picked ?? defaultRange

  // Periods that have started, newest first; the current one runs up to today. The fixed
  // presets only show if a period covers some of their days: otherwise the PDF is empty.
  const presets = useMemo(() => {
    const todayDay = format(today, ISO_DAY)
    const periodPresets = (periods ?? [])
      .filter((period) => period.startsOn <= todayDay)
      .slice(0, PERIOD_PRESETS)
      .map((period): RangePreset => ({
        label: m.reports_preset_period({ name: period.name }),
        range: (day) => {
          const end = format(day, ISO_DAY)
          return { from: period.startsOn, to: period.endsOn < end ? period.endsOn : end }
        },
      }))
    const fixedPresets = REPORT_PRESETS.filter((preset) => {
      if (!periods) return true
      const presetRange = preset.range(today)
      return overlapsPeriod(periods, presetRange.from, presetRange.to)
    })
    return [...fixedPresets, ...periodPresets]
  }, [periods, today])

  // Newest first: the calendar goes back to the first period's start.
  const firstPeriod = periods?.at(-1)

  return (
    <ReportCard
      title={m.reports_custom_title()}
      description={m.reports_range_description()}
      icon={IconCalendarEvent}
      range={isPending || hasNoDates ? null : range}
      includeAdvance={includeAdvance}
    >
      <Field className="min-w-0 @md:flex-1">
        <FieldLabel id={`${pickerId}-label`} htmlFor={pickerId}>
          {m.reports_range_label()}
        </FieldLabel>
        {hasNoDates ? (
          <NoReportDatesPicker id={pickerId} range />
        ) : (
          <RangePicker
            id={pickerId}
            value={range}
            onChange={setPicked}
            presets={presets}
            className="w-full"
            disabled={isPending}
            startMonth={firstPeriod ? parseISO(firstPeriod.startsOn) : undefined}
            // Failed to load: no limits here, like before; the PDF route answers for any dates.
            isDayDisabled={periods ? (day) => !periodFor(periods, format(day, ISO_DAY)) : undefined}
          />
        )}
      </Field>
    </ReportCard>
  )
}

/** The PDF's sections, in order (pdf/financial-report.tsx: change one, change the other). */
const REPORT_CONTENTS: { icon: TablerIcon; title: () => string; description: () => string }[] = [
  {
    icon: IconScale,
    title: () => m.reports_contents_summary_title(),
    description: () => m.reports_contents_summary_description(),
  },
  {
    icon: IconTrendingUp,
    title: () => m.reports_contents_income_title(),
    description: () => m.reports_contents_income_description(),
  },
  {
    icon: IconTrendingDown,
    title: () => m.reports_contents_expense_title(),
    description: () => m.reports_contents_expense_description(),
  },
  {
    icon: IconHomeDollar,
    title: () => m.reports_contents_fees_title(),
    description: () => m.reports_contents_fees_description(),
  },
]

interface ReportContentsCardProps extends ReportOptions {
  onIncludeAdvanceChange: (includeAdvance: boolean) => void
}

/** What the PDF has, so it's clear before downloading which dates are worth it. */
export function ReportContentsCard({ includeAdvance, onIncludeAdvanceChange }: ReportContentsCardProps) {
  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>{m.reports_contents_title()}</CardFrameTitle>
        <CardFrameDescription>{m.reports_contents_description()}</CardFrameDescription>
        <CardFrameAction>
          <IconFileDescription className="text-muted-foreground" />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className="flex flex-col gap-6">
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {REPORT_CONTENTS.map((item) => (
              <li key={item.title()} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <item.icon className="size-4" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{item.title()}</span>
                  <span className="text-sm text-muted-foreground">{item.description()}</span>
                </div>
              </li>
            ))}
          </ul>

          <Label className="flex items-start gap-2 rounded-lg border p-3 hover:bg-accent/50 has-data-checked:border-primary/48 has-data-checked:bg-accent/50">
            <Checkbox
              checked={includeAdvance}
              onCheckedChange={(checked) => {
                onIncludeAdvanceChange(checked)
              }}
            />
            <div className="flex flex-col gap-1">
              <p>{m.reports_include_advance()}</p>
              <p className="text-xs text-muted-foreground">
                <ParaglideMessage markup={messageMarkup} message={m.reports_include_advance_description} />
              </p>
            </div>
          </Label>
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
