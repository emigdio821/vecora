import type { ColumnDef } from '@tanstack/react-table'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import type { SelectExternalUser } from '@/db/schemas/zod/external-users'
import { normalizeString } from '@/lib/utils'
import { ExternalUsersTableActions } from './actions'
import { ExternalUserNameCell } from './external-user-name-cell'

export const externalUsersTableColumns: ColumnDef<SelectExternalUser>[] = [
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
    cell: ({ row }) => <ExternalUserNameCell externalUser={row.original} />,
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
    cell: ({ row }) => <p className="truncate">{row.original.email}</p>,
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Teléfono" />,
    size: 140,
    cell: ({ row }) => <p className="line-clamp-1 whitespace-normal text-left">{row.original.phone}</p>,
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    size: 55,
    cell: ({ row }) => <ExternalUsersTableActions externalUser={row.original} />,
  },
]
