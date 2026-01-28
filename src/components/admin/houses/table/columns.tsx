import type { ColumnDef } from '@tanstack/react-table'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CopyButton } from '@/components/ui/copy-button'
import { Popover, PopoverClose, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import type { HouseWithOwner } from '@/db/schemas/zod/houses'
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
      const ownerFullName = `${owner?.firstName} ${owner?.lastName}`

      return owner ? (
        <Popover>
          <PopoverTrigger render={<Button variant="plain">{ownerFullName}</Button>} />
          <PopoverContent className="min-w-52 max-w-60 p-0">
            <div className="flex flex-col gap-2">
              <div className="space-y-2 p-2 pb-0">
                <PopoverTitle className="text-muted-foreground text-sm">{ownerFullName}</PopoverTitle>
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-sm">Correo</h2>
                  <p className="line-clamp-2 text-muted-foreground text-sm">{owner.email}</p>
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="font-medium text-sm">Teléfono</h2>
                  <p className="line-clamp-2 text-muted-foreground text-sm">{owner.phone}</p>
                </div>
              </div>

              <div className="flex w-full items-center gap-1 border-t bg-muted/50 p-2">
                <PopoverClose
                  render={
                    <Button className="grow rounded-sm" size="sm" variant="outline">
                      Cerrar
                    </Button>
                  }
                />

                <CopyButton
                  value={owner.id}
                  variant="outline"
                  className="rounded-sm"
                  tooltipText="Copiar ID"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        // </div>
      ) : null
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
