import { createColumnHelper } from '@tanstack/react-table'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { formatDate, normalizeString } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import type { LogEntryQueryData } from '@/tanstack-queries/logs'
import {
  ACTION_BADGE_VARIANT,
  ACTION_LABEL,
  entryAction,
  entrySummary,
  identityName,
  sectionLabel,
} from '../entry'
import { EntrySummaryCell } from './entry-summary-cell'

const columnHelper = createColumnHelper<DataTableFeatures, LogEntryQueryData>()

export const logsTableColumns = columnHelper.columns([
  columnHelper.accessor('occurred_at', {
    id: 'occurred_at',
    size: 170,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.logs_date_time()} />,
    cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{formatDate(getValue())}</span>,
  }),

  columnHelper.accessor((row) => identityName(row), {
    id: 'identity',
    size: 160,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.logs_who()} />,
    cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
  }),

  columnHelper.accessor((row) => entryAction(row), {
    id: 'action',
    size: 100,
    header: () => m.logs_action(),
    cell: ({ getValue }) => {
      const action = getValue()
      return <Badge variant={ACTION_BADGE_VARIANT[action]}>{ACTION_LABEL[action]}</Badge>
    },
  }),

  columnHelper.accessor((row) => sectionLabel(row.table_name), {
    id: 'section',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.logs_section()} />,
    cell: ({ getValue }) => <Badge variant="outline">{getValue()}</Badge>,
  }),

  columnHelper.accessor((row) => entrySummary(row), {
    id: 'summary',
    size: 320,
    header: () => m.logs_summary(),
    cell: ({ row, table }) => <EntrySummaryCell entry={row.original} table={table} />,
    // Search box target: what changed, who did it or the section, accent-insensitive.
    filterFn: (row, _columnId, value: string) => {
      const filterValue = normalizeString(value)
      if (!filterValue) return true

      return [
        entrySummary(row.original),
        identityName(row.original),
        sectionLabel(row.original.table_name),
      ].some((field) => normalizeString(field).includes(filterValue))
    },
  }),
])
