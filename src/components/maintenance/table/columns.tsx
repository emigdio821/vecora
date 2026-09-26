import { createColumnHelper } from '@tanstack/react-table'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDay, normalizeString } from '@/lib/utils'
import type { MaintenanceRequestQueryData } from '@/tanstack-queries/maintenance'
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from '../status'
import { RequestsTableActions } from './actions'
import { RequestTitleCell } from './request-title-cell'

/** Who is looking at the table; decides which row actions show. */
export interface MaintenanceViewer {
  /** Maintenance or admin: creates, edits and deletes pending requests. */
  canRequest: boolean
  /** Treasurer or admin: pays or rejects pending requests. */
  canResolve: boolean
}

const columnHelper = createColumnHelper<DataTableFeatures, MaintenanceRequestQueryData>()

/** Columns need the viewer for the actions cell, so they're built per page. */
export function requestsTableColumns(viewer: MaintenanceViewer) {
  return columnHelper.columns([
    columnHelper.accessor('requested_on', {
      id: 'requested_on',
      size: 120,
      header: ({ column }) => <DataTableSortableHeader column={column} title="Fecha" />,
      cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{formatDay(getValue())}</span>,
    }),

    columnHelper.accessor('title', {
      id: 'title',
      size: 320,
      header: ({ column }) => <DataTableSortableHeader column={column} title="Concepto" />,
      cell: ({ row }) => <RequestTitleCell request={row.original} />,
      // Search box target: concept, details or requester, accent-insensitive.
      filterFn: (row, _columnId, value: string) => {
        const filterValue = normalizeString(value)
        if (!filterValue) return true

        const { title, details, requester } = row.original
        return [title, details, requester.full_name].some(
          (field) => field && normalizeString(field).includes(filterValue),
        )
      },
    }),

    columnHelper.accessor((row) => row.requester.full_name, {
      id: 'requester',
      size: 180,
      header: ({ column }) => <DataTableSortableHeader column={column} title="Solicitó" />,
      cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
    }),

    columnHelper.accessor((row) => Number(row.amount), {
      id: 'amount',
      size: 130,
      header: ({ column }) => (
        <DataTableSortableHeader column={column} title="Monto" className="justify-end" />
      ),
      cell: ({ getValue }) => (
        <span className="block text-right whitespace-nowrap tabular-nums">{formatCurrency(getValue())}</span>
      ),
    }),

    columnHelper.accessor('status', {
      id: 'status',
      size: 120,
      header: 'Estado',
      cell: ({ getValue }) => {
        const status = getValue()
        return <Badge variant={STATUS_BADGE_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
      },
    }),

    columnHelper.display({
      id: 'actions',
      size: 50,
      cell: ({ row }) => <RequestsTableActions request={row.original} viewer={viewer} />,
    }),
  ])
}
