import { IconMinus } from '@tabler/icons-react'
import type { ColumnDef } from '@tanstack/react-table'
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
    header: 'Número de casa',
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
    accessorKey: 'street',
    header: 'Calle',
    cell: ({ row }) => <p>{row.original.street}</p>,
  },
  {
    accessorKey: 'city',
    header: 'Ciudad',
    cell: ({ row }) => {
      const house = row.original
      const houseCityState = [house.city, house.state].filter(Boolean).join(', ')

      return houseCityState ? <p>{houseCityState}</p> : <IconMinus className="size-4" />
    },
  },
  {
    accessorKey: 'zipCode',
    header: 'Código postal',
    cell: ({ row }) => {
      const zipCode = row.original.zipCode
      return zipCode ? <p>{zipCode}</p> : <IconMinus className="size-4" />
    },
  },
  {
    accessorKey: 'owner',
    header: 'Propietario',
    cell: ({ row }) => {
      const owner = row.original.owner
      return owner ? (
        <p>
          {owner.firstName} {owner.lastName}
        </p>
      ) : (
        <IconMinus className="size-4" />
      )
    },
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    cell: ({ row }) => <HousesTableActions house={row.original} />,
  },
]
