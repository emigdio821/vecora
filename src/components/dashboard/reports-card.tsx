'use client'

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
import { DownloadIcon, FileTextIcon } from 'lucide-react'
import { useState } from 'react'
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
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toastManager } from '@/components/ui/toast'
import { formatMonth, ISO_DAY } from '@/lib/utils'

/** How far back the monthly picker goes. */
const MONTHS_BACK = 24

function monthRange(month: Date): DayRange {
  return toRange(startOfMonth(month), endOfMonth(month))
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Newest first; the running month is included and marked as such. */
function monthItems(today: Date): { value: string; label: string }[] {
  return Array.from({ length: MONTHS_BACK }, (_, i) => {
    const month = startOfMonth(subMonths(today, i))
    const value = format(month, ISO_DAY)
    const label = capitalize(formatMonth(value))
    return { value, label: i === 0 ? `${label} (en curso)` : label }
  })
}

const REPORT_PRESETS: RangePreset[] = [
  { label: 'Este mes', range: (today) => monthRange(today) },
  { label: 'Mes pasado', range: (today) => monthRange(subMonths(today, 1)) },
  { label: 'Últimos 3 meses', range: (today) => toRange(startOfMonth(subMonths(today, 2)), today) },
  { label: 'Este año', range: (today) => toRange(startOfYear(today), today) },
  {
    label: 'Año pasado',
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
    throw new Error(body?.error ?? 'No se pudo generar el reporte. Recarga la página e inténtalo de nuevo.')
  }

  const disposition = response.headers.get('Content-Disposition') ?? ''
  const fileName = /filename="(.+)"/.exec(disposition)?.[1] ?? 'reporte.pdf'
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

type Source = 'month' | 'range'

/** Everything report related on the home page: one month, or any range of days. */
export function ReportsCard() {
  const today = new Date()
  const [months] = useState(() => monthItems(today))
  const [month, setMonth] = useState(() => format(startOfMonth(subMonths(today, 1)), ISO_DAY))
  const [range, setRange] = useState<DayRange>(() => toRange(startOfMonth(today), today))

  const mutation = useMutation({
    mutationFn: ({ range }: { range: DayRange; source: Source }) => downloadReport(range),
    onSuccess: () => {
      toastManager.add({ type: 'success', title: 'Reporte descargado' })
    },
    onError: (error) => {
      toastManager.add({ type: 'error', title: 'Error', description: error.message })
    },
  })

  const isLoading = (source: Source) => mutation.isPending && mutation.variables.source === source

  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>Reporte financiero</CardFrameTitle>
        <CardFrameDescription>
          PDF con ingresos, egresos, saldo y casas con cuotas pendientes.
        </CardFrameDescription>
        <CardFrameAction className="text-muted-foreground">
          <FileTextIcon />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Field>
              <FieldLabel>Reporte mensual</FieldLabel>
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
              <FieldDescription>Del día 1 al último día del mes.</FieldDescription>
            </Field>
            <Button
              className="self-start"
              loading={isLoading('month')}
              disabled={mutation.isPending}
              onClick={() => {
                mutation.mutate({ range: monthRange(parseISO(month)), source: 'month' })
              }}
            >
              <DownloadIcon />
              Descargar PDF
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <Field>
              <FieldLabel>Rango de fechas</FieldLabel>
              <RangePicker value={range} onChange={setRange} presets={REPORT_PRESETS} />
              <FieldDescription>Elige el primer y el último día del reporte.</FieldDescription>
            </Field>
            <Button
              className="self-start"
              variant="outline"
              loading={isLoading('range')}
              disabled={mutation.isPending}
              onClick={() => {
                mutation.mutate({ range, source: 'range' })
              }}
            >
              <DownloadIcon />
              Descargar PDF
            </Button>
          </div>
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
