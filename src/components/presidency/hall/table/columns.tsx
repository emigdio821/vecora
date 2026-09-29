import { createColumnHelper } from '@tanstack/react-table'
import { format } from 'date-fns'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { formatDay, ISO_DAY, normalizeString } from '@/lib/utils'
import type { HallReservationQueryData } from '@/tanstack-queries/presidency'
import { HallReservationsTableActions } from './actions'

const columnHelper = createColumnHelper<DataTableFeatures, HallReservationQueryData>()

export const hallReservationsTableColumns = columnHelper.columns([
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

  columnHelper.accessor('notes', {
    id: 'notes',
    size: 360,
    header: 'Notas',
    cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
  }),

  columnHelper.display({
    id: 'actions',
    size: 50,
    cell: ({ row }) => <HallReservationsTableActions reservation={row.original} />,
  }),
])
