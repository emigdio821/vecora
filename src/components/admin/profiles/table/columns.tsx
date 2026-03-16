import type { ColumnDef } from '@tanstack/react-table'
import type { ProfileQueryData } from '@/api/tanstack-queries/profiles'
import { ProfileTypeBadge } from '@/components/shared/profile-type-badge'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { ProfileStatusBadge } from '@/components/shared/users/profile-status-badge'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import { normalizeString } from '@/lib/utils'
import { ProfilesTableActions } from './actions'
import { ProfileNameCell } from './profile-name-cell'

export const profilesTableColumns: ColumnDef<ProfileQueryData>[] = [
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
    id: 'user-name',
    size: 300,
    accessorKey: 'user.name',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Nombre" />,
    cell: ({ row }) => <ProfileNameCell profile={row.original} />,
    filterFn: (row, _, value: string) => {
      const user = row.original.user
      const userName = user?.name || ''

      const normalizeUserFullName = normalizeString(userName).toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return normalizeUserFullName.includes(normalizedValue) || false
    },
  },
  {
    accessorKey: 'profileType',
    size: 150,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Tipo de perfil" />,
    cell: ({ row }) => <ProfileTypeBadge isOwner={row.original.resident.isOwner} />,
  },
  {
    accessorKey: 'profileRoles',
    size: 150,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Rol" />,
    cell: ({ row }) => <RoleNameBadge roleName={row.original.user.role || ''} />,
  },
  {
    id: 'ban-status',
    accessorKey: 'user.banned',
    size: 100,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Estado" />,
    cell: ({ row }) => <ProfileStatusBadge banned={row.original.user?.banned || false} />,
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    size: 55,
    cell: ({ row }) => <ProfilesTableActions profile={row.original} />,
  },
]
