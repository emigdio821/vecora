import type { ColumnDef } from '@tanstack/react-table'
import { MemberStatusBadge } from '@/components/shared/member-status-badge'
import { ProfileTypeBadge } from '@/components/shared/profile-type-badge'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import type { HoaBoardMemberWithProfile } from '@/db/schemas/zod/hoa-board'
import { cn, normalizeString } from '@/lib/utils'

export const hoaBoardMembersTableColumns: ColumnDef<HoaBoardMemberWithProfile>[] = [
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
    cell: ({ row }) => {
      const { firstName, lastName, profileId } = row.original
      const fullName = `${firstName} ${lastName}`
      const isDeleted = !profileId

      return (
        <div className="flex items-center gap-2">
          <p className={cn(isDeleted && 'text-muted-foreground')}>{fullName}</p>
        </div>
      )
    },
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
    accessorKey: 'profile',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Rol" />,
    size: 200,
    cell: ({ row }) => {
      const profile = row.original.profile
      const roleName = profile?.profileRoles[0]?.role.name || 'Sin rol'

      return <RoleNameBadge roleName={roleName} />
    },
  },
  {
    accessorKey: 'profileType',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Tipo" />,
    size: 120,
    cell: ({ row }) => <ProfileTypeBadge type={row.original.profileType} />,
  },
  {
    id: 'status',
    header: 'Estado',
    size: 100,
    enableSorting: false,
    cell: ({ row }) => {
      const isActive = !!row.original.profileId
      return <MemberStatusBadge deleted={!isActive} />
    },
  },
  {
    id: 'actions',
    size: 48,
    enablePinning: false,
    enableResizing: false,
    enableSorting: false,
    cell: () => {
      // Actions will be added later
      return null
    },
  },
]
