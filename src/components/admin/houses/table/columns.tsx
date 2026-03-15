import type { ColumnDef } from '@tanstack/react-table'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import type { HouseWithOwner } from '@/db/schema/zod/houses'
import { normalizeString } from '@/lib/utils'
import { HousesTableActions } from './actions'
import { HouseNumberCell } from './house-number-cell'

export const housesTableColumns: ColumnDef<HouseWithOwner>[] = [
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
    accessorKey: 'houseNumber',
    size: 80,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Casa" />,
    cell: ({ row }) => <HouseNumberCell house={row.original} />,
    filterFn: (row, _, value: string) => {
      const ownerFullName = row.original.owner
        ? `${row.original.owner.firstName} ${row.original.owner.lastName}`
        : ''
      const normalizedHouseNumber = normalizeString(row.original.houseNumber).toLowerCase()
      const normalizeOwnerFullName = normalizeString(ownerFullName).toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return (
        normalizedHouseNumber.includes(normalizedValue) ||
        normalizeOwnerFullName.includes(normalizedValue) ||
        false
      )
    },
  },
  {
    accessorKey: 'owner',
    size: 300,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Propietario" />,
    cell: ({ row }) => {
      const owner = row.original.owner
      const ownerFullName = `${owner?.firstName} ${owner?.lastName}`

      return owner ? <p className="line-clamp-2 whitespace-normal text-left">{ownerFullName}</p> : null
    },
  },
  {
    accessorKey: 'street',
    size: 220,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Calle" />,
    cell: ({ row }) => <p className="line-clamp-2 whitespace-normal text-left">{row.original.street}</p>,
  },
  {
    accessorKey: 'city',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Ciudad" />,
    size: 180,
    sortingFn: (rowA, rowB) => {
      const rowACity = [rowA.original.city, rowA.original.state].filter(Boolean).join(', ')
      const rowBCity = [rowB.original.city, rowB.original.state].filter(Boolean).join(', ')

      return rowACity.localeCompare(rowBCity)
    },
    cell: ({ row }) => {
      const house = row.original
      const houseCityState = [house.city, house.state].filter(Boolean).join(', ')

      return houseCityState && <p className="line-clamp-2 whitespace-normal text-left">{houseCityState}</p>
    },
  },
  {
    accessorKey: 'zipCode',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Código postal" />,
    size: 180,
    cell: ({ row }) => {
      const zipCode = row.original.zipCode
      return zipCode && <p>{zipCode}</p>
    },
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    size: 50,
    cell: ({ row }) => <HousesTableActions house={row.original} />,
  },
]
