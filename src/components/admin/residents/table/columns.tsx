import { IconCurrencyDollar, IconFlag } from '@tabler/icons-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { ResidentQueryData } from '@/api/tanstack-queries/residents'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { DataTableIconHeader } from '@/components/table/icon-header'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { normalizeString } from '@/lib/utils'
import { ResidentsTableActions } from './actions'
import { ResidentNameCell } from './resident-name-cell'

export const residentsTableColumns: ColumnDef<ResidentQueryData>[] = [
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
    accessorKey: 'name',
    size: 220,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Nombre" />,
    cell: ({ row }) => <ResidentNameCell resident={row.original} />,
    sortingFn: (rowA, rowB) => {
      const fullNameA = `${rowA.original.firstName} ${rowA.original.lastName}`
      const fullNameB = `${rowB.original.firstName} ${rowB.original.lastName}`
      return fullNameA.localeCompare(fullNameB)
    },
    filterFn: (row, _, value: string) => {
      const resident = row.original
      const fullName = `${resident.firstName} ${resident.lastName}`
      const normalizedFullName = normalizeString(fullName).toLowerCase()
      const normalizedEmail = normalizeString(resident.email).toLowerCase()
      const normalizedPhone = normalizeString(resident.phone).toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return (
        normalizedFullName.includes(normalizedValue) ||
        normalizedEmail.includes(normalizedValue) ||
        normalizedPhone.includes(normalizedValue) ||
        false
      )
    },
  },
  {
    accessorKey: 'email',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Correo" />,
    cell: ({ row }) => <p className="line-clamp-2 whitespace-normal text-left">{row.original.email}</p>,
  },
  {
    accessorKey: 'phone',
    size: 180,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Teléfono" />,
    cell: ({ row }) => <p>{row.original.phone}</p>,
  },
  {
    accessorKey: 'houses',
    size: 180,
    enableSorting: false,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Casas" />,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.houses.map((house) => (
          <Badge key={house.id} variant="outline">
            {house.houseNumber}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'isOwner',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Tipo" />,
    cell: ({ row }) => <Badge variant="outline">{row.original.isOwner ? 'Propietario' : 'Residente'}</Badge>,
  },
  {
    accessorKey: 'role',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Rol" />,
    cell: ({ row }) => {
      const role = row.original.profile?.user?.role

      return role ? <RoleNameBadge roleName={role} /> : <Badge variant="warning">Sin rol</Badge>
    },
    sortingFn: (rowA, rowB) => {
      const roleA = rowA.original.profile?.user?.role || ''
      const roleB = rowB.original.profile?.user?.role || ''
      return roleA.localeCompare(roleB)
    },
  },
  {
    accessorKey: 'violations',
    size: 120,
    enableSorting: false,
    header: () => <DataTableIconHeader tipContent="Infracciones" icon={<IconFlag className="size-4" />} />,
    cell: ({ row }) =>
      row.original.violations.length > 0 ? (
        <Badge variant="warning">{row.original.violations.length}</Badge>
      ) : null,
  },
  {
    accessorKey: 'payments',
    size: 120,
    enableSorting: false,
    header: () => <DataTableIconHeader tipContent="Pagos" icon={<IconCurrencyDollar className="size-4" />} />,
    cell: ({ row }) =>
      row.original.payments.length > 0 ? (
        <Badge variant="warning">{row.original.payments.length}</Badge>
      ) : null,
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    size: 50,
    cell: ({ row }) => <ResidentsTableActions resident={row.original} />,
  },
]
