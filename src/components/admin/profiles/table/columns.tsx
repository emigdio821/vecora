import type { ColumnDef } from '@tanstack/react-table'
import { ProfileTypeBadge } from '@/components/shared/profile-type-badge'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { ProfileStatusBadge } from '@/components/shared/users/profile-status-badge'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import type { ProfileWithAllRelations } from '@/db/schemas/zod/profiles'
import { ProfilesTableActions } from './actions'

export const profilesTableColumns: ColumnDef<ProfileWithAllRelations>[] = [
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
    accessorKey: 'user.name',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Estado" />,
    size: 200,
  },
  {
    accessorKey: 'profileType',
    size: 150,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Tipo de perfil" />,
    cell: ({ row }) => <ProfileTypeBadge type={row.original.profileType} />,
  },
  {
    accessorKey: 'id',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Ligado a" />,
    cell: ({ row }) => {
      const profile = row.original
      const owner = profile.owner
      const externalUser = profile.externalUser

      return owner ? 'Propietario' : externalUser ? 'Usuario externo' : 'N/A'
    },
  },
  {
    accessorKey: 'user.banned',
    size: 100,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Estado" />,
    cell: ({ row }) => <ProfileStatusBadge banned={row.original.user?.banned || false} />,
  },
  {
    accessorKey: 'profileRoles',
    size: 300,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Rol" />,
    cell: ({ row }) => {
      const roles = row.original.profileRoles?.map(({ role }) => role.name) || []
      const roleBadges = roles.map((role) => <RoleNameBadge roleName={role} key={role} />)

      return <>{roleBadges.length > 0 && <div className="flex flex-wrap gap-1">{roleBadges}</div>}</>
    },
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    size: 28,
    cell: ({ row }) => <ProfilesTableActions profile={row.original} />,
  },
]
