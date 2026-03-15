import { IconCurrencyDollar, IconFlag } from '@tabler/icons-react'
import type { ColumnDef } from '@tanstack/react-table'
import { HouseNumberBadge } from '@/components/shared/houses/house-number-badge'
import { DataTableIconHeader } from '@/components/table/icon-header'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { OwnerWithRelations } from '@/db/schema/zod/owners'
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
    size: 300,
    cell: ({ row }) => <OwnerNameCell owner={row.original} />,
    filterFn: (row, _, value: string) => {
      const normalizedFirstName = normalizeString(row.original.firstName).toLowerCase()
      const normalizedLastName = normalizeString(row.original.lastName).toLowerCase()
      const normalizedFullName = `${normalizedFirstName} ${normalizedLastName}`
      const normalizedValue = normalizeString(value).toLowerCase()

      return (
        normalizedFirstName.includes(normalizedValue) ||
        normalizedLastName.includes(normalizedValue) ||
        normalizedFullName.includes(normalizedValue)
      )
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Correo" />,
    size: 200,
    cell: ({ row }) => <p className="line-clamp-1 whitespace-normal text-left">{row.original.email}</p>,
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Teléfono" />,
    size: 140,
    cell: ({ row }) => <p className="line-clamp-1 whitespace-normal text-left">{row.original.phone}</p>,
  },
  {
    accessorKey: 'houses',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Casas" />,
    size: 140,
    cell: ({ row }) => {
      const houses = row.original.houses
      const houseBadges = houses.map((house) => (
        <HouseNumberBadge number={house.houseNumber} key={house.id} />
      ))

      return <>{houseBadges.length > 0 && <div className="flex flex-wrap gap-1">{houseBadges}</div>}</>
    },
  },
  {
    accessorKey: 'violations',
    size: 60,
    header: () => <DataTableIconHeader icon={<IconFlag className="size-4" />} tipContent="Infracciones" />,
    cell: ({ row }) => {
      const violations = row.original.violations

      return (
        violations.length > 0 && (
          <Badge variant="warning">
            <span>{violations.length}</span>
          </Badge>
        )
      )
    },
  },
  {
    accessorKey: 'payments',
    size: 60,
    header: () => (
      <DataTableIconHeader icon={<IconCurrencyDollar className="size-4" />} tipContent="Pagos pendientes" />
    ),

    cell: ({ row }) => {
      const payments = row.original.payments.filter((p) => p.status === 'pending')

      return (
        payments.length > 0 && (
          <Badge variant="warning">
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
    size: 50,
    cell: ({ row }) => <OwnersTableActions owner={row.original} />,
  },
]
