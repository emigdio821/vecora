import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatDay, ISO_DAY, normalizeString } from '@/lib/utils'
import type { PeriodQueryData, PeriodSummaryQueryData } from '@/tanstack-queries/treasury'
import { PeriodsTableActions } from './actions'

/** A period joined with its live totals (absent until the summary view loads). */
export type PeriodRow = PeriodQueryData & { summary: PeriodSummaryQueryData | undefined }

/** "YYYY-MM-DD" strings compare correctly as text, so no parsing needed. */
function isCurrentPeriod(period: PeriodQueryData) {
  const today = format(new Date(), ISO_DAY)
  return period.starts_on <= today && today <= period.ends_on
}

const columnHelper = createColumnHelper<DataTableFeatures, PeriodRow>()

export const periodsTableColumns = columnHelper.columns([
  columnHelper.accessor('name', {
    id: 'name',
    size: 180,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Periodo" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="truncate">{row.original.name}</span>
        {isCurrentPeriod(row.original) && <Badge variant="info">Actual</Badge>}
      </div>
    ),
    // Search box target: "2026", "2026-2027"…, accent-insensitive.
    filterFn: (row, _columnId, value: string) => {
      const filterValue = normalizeString(value)
      if (!filterValue) return true
      return normalizeString(row.original.name).includes(filterValue)
    },
  }),

  columnHelper.accessor('starts_on', {
    id: 'starts_on',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Inicio" />,
    cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{formatDay(getValue())}</span>,
  }),

  columnHelper.accessor('ends_on', {
    id: 'ends_on',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Fin" />,
    cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{formatDay(getValue())}</span>,
  }),

  columnHelper.accessor((row) => Number(row.monthly_fee), {
    id: 'monthly_fee',
    size: 130,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Cuota" className="justify-end" />,
    cell: ({ getValue }) => (
      <span className="block text-right whitespace-nowrap tabular-nums">{formatCurrency(getValue())}</span>
    ),
  }),

  columnHelper.accessor((row) => Number(row.late_fee), {
    id: 'late_fee',
    size: 120,
    header: ({ column }) => (
      <DataTableSortableHeader column={column} title="Recargo" className="justify-end" />
    ),
    cell: ({ getValue }) => (
      <span className="block text-right whitespace-nowrap tabular-nums">{formatCurrency(getValue())}</span>
    ),
  }),

  columnHelper.accessor('due_day', {
    id: 'due_day',
    size: 110,
    header: 'Día límite',
    cell: ({ getValue }) => <span className="tabular-nums">Día {getValue()}</span>,
  }),

  columnHelper.accessor((row) => (row.summary ? Number(row.summary.balance) : 0), {
    id: 'balance',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Saldo" className="justify-end" />,
    cell: ({ row, getValue }) => {
      if (!row.original.summary) return null
      const balance = getValue()
      return (
        <span
          className={cn(
            'block text-right whitespace-nowrap tabular-nums',
            balance < 0 && 'text-destructive-foreground',
          )}
        >
          {formatCurrency(balance)}
        </span>
      )
    },
  }),

  columnHelper.display({
    id: 'actions',
    size: 50,
    cell: ({ row }) => <PeriodsTableActions period={row.original} />,
  }),
])
