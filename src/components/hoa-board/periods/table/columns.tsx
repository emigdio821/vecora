import type { ColumnDef } from '@tanstack/react-table'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { HoaBoardPeriodWithMembers } from '@/db/schema/zod/hoa-board'
import { formatDate, normalizeString } from '@/lib/utils'
import { HoaPeriodsTableActions } from './actions'
import { HoaPeriodCell } from './period-cell'

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
    cell: ({ row }) => <HoaPeriodCell period={row.original} />,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Fecha inicial" />,
    size: 200,
    filterFn: (row, _, value: string) => {
      const normalizedStartDate = normalizeString(formatDate(row.original.startDate)).toLowerCase()
      const normalizedEndDate = normalizeString(formatDate(row.original.endDate)).toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return normalizedStartDate.includes(normalizedValue) || normalizedEndDate.includes(normalizedValue)
    },
  },
  {
    accessorKey: 'endDate',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Fecha final" />,
    size: 200,
    cell: ({ row }) => {
      const date = new Date(row.original.endDate)
      return <p className="line-clamp-1">{formatDate(date)}</p>
    },
  },
  {
    accessorKey: 'members',
    header: 'Miembros',
    size: 100,
    enableSorting: false,
    cell: ({ row }) => {
      const activeMembers = row.original.members?.filter((member) => !member.deletedAt) || []

      return <Badge variant="outline">{activeMembers.length}</Badge>
    },
  },
  {
    id: 'actions',
    size: 55,
    enablePinning: false,
    enableResizing: false,
    enableSorting: false,
    cell: ({ row }) => <HoaPeriodsTableActions period={row.original} />,
  },
]
