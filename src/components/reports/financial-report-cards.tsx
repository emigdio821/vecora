import { ParaglideMessage } from '@inlang/paraglide-js-react'
import {
  IconCalendarEvent,
  IconCalendarMonth,
  IconDownload,
  IconFileDescription,
  IconHomeDollar,
  IconScale,
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
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toastManager } from '@/components/ui/toast'
import { useToday } from '@/hooks/use-today'
import { formatMonth, ISO_DAY } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { periodsQueryOptions } from '@/tanstack-queries/treasury'

/** How far back the monthly picker goes. */
const MONTHS_BACK = 24

function monthRange(month: Date): DayRange {
  return toRange(startOfMonth(month), endOfMonth(month))
}

/** Newest first; the running month is included and marked as such. */
function monthItems(today: Date): { value: string; label: string }[] {
  return Array.from({ length: MONTHS_BACK }, (_, i) => {
    const month = startOfMonth(subMonths(today, i))
    const value = format(month, ISO_DAY)
    const label = formatMonth(value)
    return { value, label: i === 0 ? m.reports_month_in_progress({ month: label }) : label }
  })
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

/** Each card has its own, so only the one clicked shows as busy. */
function DownloadReportButton({ range, includeAdvance }: { range: DayRange; includeAdvance: boolean }) {
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
      disabled={mutation.isPending}
      onClick={() => {
        mutation.mutate({ range, includeAdvance })
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
  range: DayRange
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

/** A whole month; last month by default, the one usually reported. */
export function MonthlyReportCard({ includeAdvance }: ReportOptions) {
  const today = useToday()
  const [months] = useState(() => monthItems(today))
  const [month, setMonth] = useState(() => format(startOfMonth(subMonths(today, 1)), ISO_DAY))

  return (
    <ReportCard
      title={m.reports_monthly_title()}
      description={m.reports_month_description()}
      icon={IconCalendarMonth}
      range={monthRange(parseISO(month))}
      includeAdvance={includeAdvance}
    >
      <Field className="min-w-0 @md:flex-1">
        <FieldLabel>{m.reports_month_label()}</FieldLabel>
        <Select
          items={months}
          value={month}
          onValueChange={(value) => {
            if (value) setMonth(value)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {months.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </Field>
    </ReportCard>
  )
}

/** The latest periods get a preset each; older ones are a few clicks away in the calendar. */
const PERIOD_PRESETS = 3

/** Any range of days, from one day to several years. */
export function CustomReportCard({ includeAdvance }: ReportOptions) {
  const today = useToday()
  const [range, setRange] = useState<DayRange>(() => toRange(startOfMonth(today), today))
  const pickerId = useId()
  const { data: periods } = useQuery(periodsQueryOptions)

  // Periods that have started, newest first; the current one runs up to today.
  const presets = useMemo(() => {
    const todayDay = format(today, ISO_DAY)
    const periodPresets = (periods ?? [])
      .filter((period) => period.starts_on <= todayDay)
      .slice(0, PERIOD_PRESETS)
      .map((period): RangePreset => ({
        label: m.reports_preset_period({ name: period.name }),
        range: (day) => {
          const end = format(day, ISO_DAY)
          return { from: period.starts_on, to: period.ends_on < end ? period.ends_on : end }
        },
      }))
    return [...REPORT_PRESETS, ...periodPresets]
  }, [periods, today])

  return (
    <ReportCard
      title={m.reports_custom_title()}
      description={m.reports_range_description()}
      icon={IconCalendarEvent}
      range={range}
      includeAdvance={includeAdvance}
    >
      <Field className="min-w-0 @md:flex-1">
        <FieldLabel id={`${pickerId}-label`} htmlFor={pickerId}>
          {m.reports_range_label()}
        </FieldLabel>
        <RangePicker id={pickerId} value={range} onChange={setRange} presets={presets} className="w-full" />
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
