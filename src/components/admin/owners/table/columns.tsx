import type { ColumnDef } from '@tanstack/react-table'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { OwnerWithRelations } from '@/db/schemas/zod/owners'
import { normalizeString } from '@/lib/utils'
import { OwnersTableActions } from './actions'
import { OwnerNameCell } from './owner-name-cell'

export const ownersTableColumns: ColumnDef<OwnerWithRelations>[] = [
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
    accessorKey: 'firstName',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Nombre" />,
    size: 200,
    cell: ({ row }) => <OwnerNameCell owner={row.original} />,
    filterFn: (row, _, value: string) => {
      const normalizedFirstName = normalizeString(row.original.firstName).toLowerCase()
      const normalizedLastName = normalizeString(row.original.lastName).toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return (
        normalizedFirstName.includes(normalizedValue) || normalizedLastName.includes(normalizedValue) || false
      )
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Correo" />,
    size: 200,
    cell: ({ row }) => <p className="truncate">{row.original.email}</p>,
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Teléfono" />,
    size: 140,
    cell: ({ row }) => <p className="truncate">{row.original.phone}</p>,
  },
  {
    accessorKey: 'houses',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Casas" />,
    size: 140,
    cell: ({ row }) => {
      const houses = row.original.houses
      const houseBadges = houses.map((house) => (
        <Badge size="lg" variant="outline" key={house.id}>
          <span>{house.houseNumber}</span>
        </Badge>
      ))

      return <>{houseBadges.length > 0 && <div className="flex flex-wrap gap-1">{houseBadges}</div>}</>
    },
  },
  {
    accessorKey: 'violations',
    header: 'Infracciones',
    size: 40,
    cell: ({ row }) => {
      const violations = row.original.violations

      return (
        violations.length > 0 && (
          <Badge size="lg" variant="outline">
            <span aria-hidden className="size-1.5 rounded-full bg-warning" />
            <span>{violations.length}</span>
          </Badge>
        )
      )
    },
  },
  {
    accessorKey: 'payments',
    header: 'Pagos pendientes',
    size: 40,
    cell: ({ row }) => {
      const payments = row.original.payments.filter((p) => p.status === 'pending')

      return (
        payments.length > 0 && (
          <Badge size="lg" variant="outline">
            <span aria-hidden className="size-1.5 rounded-full bg-warning" />
            <span>{payments.length}</span>
          </Badge>
        )
      )
    },
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    size: 28,
    cell: ({ row }) => <OwnersTableActions owner={row.original} />,
  },
]
