import { IconDownload } from '@tabler/icons-react'
import { useMutation } from '@tanstack/react-query'
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
import { useState } from 'react'
import { type DayRange, RangePicker, type RangePreset, toRange } from '@/components/shared/range-picker'
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogPanel,
  ResponsiveDialogPopup,
  ResponsiveDialogTitle,
} from '@/components/shared/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import { toastManager } from '@/components/ui/toast'
import { useToday } from '@/hooks/use-today'
import { formatMonth, ISO_DAY } from '@/lib/utils'
import { m } from '@/paraglide/messages'

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
async function downloadReport(range: DayRange) {
  const response = await fetch(`/reports/pdf?${new URLSearchParams({ from: range.from, to: range.to })}`)
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

type ReportTab = 'monthly' | 'custom'

interface FinancialReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * One month, or any range of days. The choices survive closing, so a second
 * download is one click. A drawer on mobile.
 */
export function FinancialReportDialog({ open, onOpenChange }: FinancialReportDialogProps) {
  const today = useToday()
  const [tab, setTab] = useState<ReportTab>('monthly')
  const [months] = useState(() => monthItems(today))
  const [month, setMonth] = useState(() => format(startOfMonth(subMonths(today, 1)), ISO_DAY))
  const [range, setRange] = useState<DayRange>(() => toRange(startOfMonth(today), today))

  const mutation = useMutation({
    mutationFn: downloadReport,
    onSuccess: () => {
      toastManager.add({ type: 'success', title: m.reports_downloaded() })
      onOpenChange(false)
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: m.common_error(), description: error.message })
    },
  })

  // Still busy after a download, until the dialog has closed and reset the mutation.
  const isBusy = mutation.isPending || mutation.isSuccess

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(isOpen) => {
        // Clears `success`, which keeps the buttons busy while the dialog closes.
        if (!isOpen) {
          mutation.reset()
        }
      }}
    >
      <ResponsiveDialogPopup>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{m.common_section_financial_report()}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{m.reports_dialog_description()}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogPanel>
          <Tabs
            value={tab}
            onValueChange={(value: ReportTab) => {
              setTab(value)
            }}
          >
            <TabsList>
              <TabsTab value="monthly">{m.reports_tab_monthly()}</TabsTab>
              <TabsTab value="custom">{m.reports_tab_custom()}</TabsTab>
            </TabsList>

            <TabsPanel value="monthly">
              <Field>
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
                <FieldDescription>{m.reports_month_description()}</FieldDescription>
              </Field>
            </TabsPanel>

            <TabsPanel value="custom">
              <Field>
                <FieldLabel>{m.reports_range_label()}</FieldLabel>
                <RangePicker value={range} onChange={setRange} presets={REPORT_PRESETS} className="w-full" />
                <FieldDescription>{m.reports_range_description()}</FieldDescription>
              </Field>
            </TabsPanel>
          </Tabs>
        </ResponsiveDialogPanel>

        <ResponsiveDialogFooter>
          <ResponsiveDialogClose render={<Button variant="ghost" />} disabled={isBusy}>
            {m.common_action_cancel()}
          </ResponsiveDialogClose>
          <Button
            loading={isBusy}
            disabled={isBusy}
            onClick={() => {
              mutation.mutate(tab === 'monthly' ? monthRange(parseISO(month)) : range)
            }}
          >
            <IconDownload />
            {m.reports_download_pdf()}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogPopup>
    </ResponsiveDialog>
  )
}
