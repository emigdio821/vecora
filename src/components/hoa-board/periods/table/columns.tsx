import type { ColumnDef } from '@tanstack/react-table'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import type { HoaBoardPeriodWithMembers } from '@/db/schemas/zod/hoa-board'

export const hoaBoardPeriodsTableColumns: ColumnDef<HoaBoardPeriodWithMembers>[] = [
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
    accessorKey: 'startDate',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Fecha inicial" />,
    size: 180,
    cell: ({ row }) => {
      const date = new Date(row.original.startDate)
      return <p>{date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    },
  },
  {
    accessorKey: 'endDate',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Fecha final" />,
    size: 180,
    cell: ({ row }) => {
      const date = new Date(row.original.endDate)
      return <p>{date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    },
  },
  {
    accessorKey: 'members',
    header: 'Miembros',
    size: 100,
    enableSorting: false,
    cell: ({ row }) => {
      const membersCount = row.original.members?.length ?? 0
      return <p className="text-center">{membersCount}</p>
    },
  },
  {
    id: 'actions',
    size: 48,
    enablePinning: false,
    enableResizing: false,
    enableSorting: false,
    cell: () => {
      // Actions will be added later
      return null
    },
  },
]
