import { createColumnHelper } from '@tanstack/react-table'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, normalizeString } from '@/lib/utils'
import { type AmenityQueryData, reservationCount } from '@/tanstack-queries/presidency'
import { AmenitiesTableActions } from './actions'

const columnHelper = createColumnHelper<DataTableFeatures, AmenityQueryData>()

export const amenitiesTableColumns = columnHelper.columns([
  columnHelper.accessor('name', {
    id: 'name',
    size: 320,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Nombre" />,
    cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
    filterFn: (row, _columnId, value: string) => {
      const filterValue = normalizeString(value)
      if (!filterValue) return true
      return normalizeString(row.original.name).includes(filterValue)
    },
  }),

  columnHelper.accessor((row) => Number(row.default_fee), {
    id: 'default_fee',
    size: 160,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Tarifa sugerida" />,
    cell: ({ getValue }) => {
      const fee = getValue()
      return fee === 0 ? (
        <span className="text-muted-foreground">Sin costo</span>
      ) : (
        <span className="tabular-nums">{formatCurrency(fee)}</span>
      )
    },
  }),

  columnHelper.accessor((row) => reservationCount(row), {
    id: 'reservations',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Reservaciones" />,
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
  }),

  columnHelper.accessor('is_active', {
    id: 'is_active',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Estado" />,
    cell: ({ getValue }) =>
      getValue() ? <Badge variant="success">Activa</Badge> : <Badge variant="secondary">Inactiva</Badge>,
  }),

  columnHelper.display({
    id: 'actions',
    size: 50,
    cell: ({ row }) => <AmenitiesTableActions amenity={row.original} />,
  }),
])
