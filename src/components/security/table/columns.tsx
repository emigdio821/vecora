import { createColumnHelper } from '@tanstack/react-table'
import { Money } from '@/components/shared/money'
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from '@/components/shared/request-status'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { formatDay, normalizeString } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import type { SecurityRequestQueryData } from '@/tanstack-queries/security'
import { KIND_LABEL } from '../kind'
import { RequestsTableActions } from './actions'
import { RequestTitleCell } from './request-title-cell'

/** Who is looking at the table; decides which row actions show. */
export interface SecurityViewer {
  /** Security or admin: creates, edits and deletes pending requests. */
  canRequest: boolean
  /** Treasurer or admin: pays or rejects pending requests. */
  canResolve: boolean
}

const columnHelper = createColumnHelper<DataTableFeatures, SecurityRequestQueryData>()

/** Columns need the viewer for the actions cell, so they're built per page. */
export function requestsTableColumns(viewer: SecurityViewer) {
  return columnHelper.columns([
    columnHelper.accessor('requested_on', {
      id: 'requested_on',
      size: 120,
      header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_date()} />,
      cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{formatDay(getValue())}</span>,
    }),

    columnHelper.accessor('title', {
      id: 'title',
      size: 320,
      header: ({ column }) => (
        <DataTableSortableHeader column={column} title={m.common_field_description()} />
      ),
      cell: ({ row }) => <RequestTitleCell request={row.original} />,
      // Search box target: concept, details, kind or requester, accent-insensitive.
      filterFn: (row, _columnId, value: string) => {
        const filterValue = normalizeString(value)
        if (!filterValue) return true

        const { title, details, kind, requester } = row.original
        return [title, details, KIND_LABEL[kind], requester.full_name].some(
          (field) => field && normalizeString(field).includes(filterValue),
        )
      },
    }),

    columnHelper.accessor((row) => KIND_LABEL[row.kind], {
      id: 'kind',
      size: 120,
      header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_type()} />,
      cell: ({ getValue }) => <Badge variant="outline">{getValue()}</Badge>,
    }),

    columnHelper.accessor((row) => row.requester.full_name, {
      id: 'requester',
      size: 180,
      header: ({ column }) => <DataTableSortableHeader column={column} title={m.requests_requester()} />,
      cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
    }),

    columnHelper.accessor((row) => Number(row.amount), {
      id: 'amount',
      size: 130,
      header: ({ column }) => (
        <DataTableSortableHeader column={column} title={m.common_field_amount()} className="justify-end" />
      ),
      cell: ({ getValue, row }) => (
        <span className="block text-right whitespace-nowrap tabular-nums">
          <Money value={getValue()} currency={row.original.currency} />
        </span>
      ),
    }),

    columnHelper.accessor('status', {
      id: 'status',
      size: 120,
      header: m.common_field_status(),
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
