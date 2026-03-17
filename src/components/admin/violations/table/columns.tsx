import type { ColumnDef } from '@tanstack/react-table'
import type { ViolationQueryData } from '@/api/server-functions/violations'
import { ViolationStatusBadge } from '@/components/shared/violations/status-badge'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDate, normalizeString } from '@/lib/utils'
import { ViolationsTableActions } from './actions'
import { ViolationConceptCell } from './violation-concept-cell'

export const violationsTableColumns: ColumnDef<ViolationQueryData>[] = [
  {
    id: 'select',
    enablePinning: false,
    enableResizing: false,
    enableSorting: false,
    size: 28,
    header: ({ table }) => (
      <Checkbox
        aria-label="Seleccionar todo"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        disabled={table.getFilteredRowModel().rows.length === 0}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Seleccionar elemento"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: 'concept',
    size: 300,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Concepto" />,
    cell: ({ row }) => <ViolationConceptCell violation={row.original} />,
    filterFn: (row, _, value: string) => {
      const ownerFullName = row.original.resident
        ? `${row.original.resident.firstName} ${row.original.resident.lastName}`
        : ''
      const normalizedConcept = normalizeString(row.original.concept).toLowerCase()
      const normalizeOwnerFullName = normalizeString(ownerFullName).toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return (
        normalizedConcept.includes(normalizedValue) ||
        normalizeOwnerFullName.includes(normalizedValue) ||
        false
      )
    },
  },
  {
    accessorKey: 'owner',
    size: 280,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Propietario" />,
    cell: ({ row }) => {
      const owner = row.original.resident
      return owner && <p className="truncate">{`${owner.firstName} ${owner.lastName}`}</p>
    },
  },
  {
    accessorKey: 'amount',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Monto" />,
    sortingFn: (rowA, rowB) => Number(rowA.original.amount) - Number(rowB.original.amount),
    cell: ({ row }) => <p>${row.original.amount}</p>,
  },
  {
    accessorKey: 'status',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Estatus" />,
    cell: ({ row }) => <ViolationStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'violationDate',
    size: 150,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Fecha" />,
    cell: ({ row }) => <p>{formatDate(row.original.violationDate)}</p>,
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    size: 55,
    cell: ({ row }) => <ViolationsTableActions violation={row.original} />,
  },
]
