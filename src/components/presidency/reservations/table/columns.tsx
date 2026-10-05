import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Money } from '@/components/shared/money'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { formatDay, ISO_DAY, normalizeString } from '@/lib/utils'
import type { ReservationQueryData } from '@/tanstack-queries/presidency'
import {
  RESERVATION_STATUS_BADGE_VARIANT,
  RESERVATION_STATUS_LABEL,
  RESERVATION_STATUS_ORDER,
  reservationRefund,
  reservationStatus,
} from '../status'
import { ReservationsTableActions } from './actions'

const columnHelper = createColumnHelper<DataTableFeatures, ReservationQueryData>()

export const reservationsTableColumns = columnHelper.columns([
  columnHelper.accessor('reserved_on', {
    id: 'reserved_on',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Fecha" />,
    cell: ({ getValue }) => {
      const value = getValue()
      const today = format(new Date(), ISO_DAY)
      return (
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap tabular-nums">{formatDay(value)}</span>
          {value === today ? (
            <Badge variant="info">Hoy</Badge>
          ) : value < today ? (
            <Badge variant="secondary">Pasada</Badge>
          ) : null}
        </div>
      )
    },
    // Search box target: house number or notes, accent-insensitive.
    filterFn: (row, _columnId, value: string) => {
      const filterValue = normalizeString(value)
      if (!filterValue) return true

      const { property, notes } = row.original
      return [`casa ${property.number}`, notes].some(
        (field) => field && normalizeString(field).includes(filterValue),
      )
    },
  }),

  columnHelper.accessor((row) => row.amenity.name, {
    id: 'amenity',
    size: 160,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Área" />,
    cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
  }),

  columnHelper.accessor((row) => row.property.number, {
    id: 'property',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Casa" />,
    cell: ({ getValue }) => getValue(),
    sortFn: (rowA, rowB) =>
      rowA.original.property.number.localeCompare(rowB.original.property.number, 'es', {
        numeric: true,
        sensitivity: 'base',
      }),
  }),

  columnHelper.accessor((row) => Number(row.amount), {
    id: 'amount',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Monto" />,
    cell: ({ getValue, row }) => (
      <span className="tabular-nums">
        <Money value={getValue()} currency={row.original.currency} />
      </span>
    ),
  }),

  columnHelper.accessor((row) => reservationStatus(row), {
    id: 'status',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Estado" />,
    sortFn: (rowA, rowB) =>
      RESERVATION_STATUS_ORDER[reservationStatus(rowA.original)] -
      RESERVATION_STATUS_ORDER[reservationStatus(rowB.original)],
    cell: ({ row, getValue }) => {
      const status = getValue()
      const refund = reservationRefund(row.original)
      return (
        <div className="flex items-center gap-2">
          <Badge variant={RESERVATION_STATUS_BADGE_VARIANT[status]}>{RESERVATION_STATUS_LABEL[status]}</Badge>
          {refund && (
            <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
              Reembolso <Money value={refund.amount} currency={row.original.currency} />
            </span>
          )}
        </div>
      )
    },
  }),

  columnHelper.accessor('notes', {
    id: 'notes',
    size: 360,
    header: 'Notas',
    cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
  }),

  columnHelper.display({
    id: 'actions',
    size: 50,
    cell: ({ row }) => <ReservationsTableActions reservation={row.original} />,
  }),
])
