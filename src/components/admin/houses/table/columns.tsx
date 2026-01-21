import type { ColumnDef } from '@tanstack/react-table'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import type { HouseWithOwner } from '@/db/schemas/zod'
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
    size: 40,
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
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Propietario" />,
    cell: ({ row }) => {
      const owner = row.original.owner

      return owner && <p>{`${owner.firstName} ${owner.lastName}`}</p>
    },
  },
  {
    accessorKey: 'street',
    size: 220,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Calle" />,
    cell: ({ row }) => <p>{row.original.street}</p>,
  },
  {
    accessorKey: 'city',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Ciudad" />,
    size: 200,
    sortingFn: (rowA, rowB) => {
      const rowACity = [rowA.original.city, rowA.original.state].filter(Boolean).join(', ')
      const rowBCity = [rowB.original.city, rowB.original.state].filter(Boolean).join(', ')

      return rowACity.localeCompare(rowBCity)
    },
    cell: ({ row }) => {
      const house = row.original
      const houseCityState = [house.city, house.state].filter(Boolean).join(', ')

      return houseCityState && <p>{houseCityState}</p>
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
    size: 28,
    cell: ({ row }) => <HousesTableActions house={row.original} />,
  },
]
