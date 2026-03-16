import type { ColumnDef } from '@tanstack/react-table'
import type { HoaBoardMemberQueryData } from '@/api/tanstack-queries/hoa-board'
import { MemberStatusBadge } from '@/components/shared/member-status-badge'
import { ProfileTypeBadge } from '@/components/shared/profile-type-badge'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import { normalizeString } from '@/lib/utils'
import { HoaMembersTableActions } from './actions'
import { HoaMemberNameCell } from './member-cell'

export const hoaBoardMembersTableColumns: ColumnDef<HoaBoardMemberQueryData>[] = [
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
    size: 300,
    cell: ({ row }) => <HoaMemberNameCell member={row.original} />,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Nombre" />,
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
    size: 120,
    cell: ({ row }) => <RoleNameBadge roleName={row.original.profile?.user?.role || ''} />,
  },
  {
    accessorKey: 'profileType',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Tipo" />,
    size: 120,
    cell: ({ row }) => <ProfileTypeBadge isOwner={row.original.isOwner} />,
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
    size: 55,
    enablePinning: false,
    enableResizing: false,
    enableSorting: false,
    cell: ({ row }) => <HoaMembersTableActions member={row.original} />,
  },
]
