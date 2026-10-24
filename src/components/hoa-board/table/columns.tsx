import { Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { normalizeString } from '@/lib/utils'
import { APP_ROLES } from '@/lib/validations/hoa-board'
import { m } from '@/paraglide/messages'
import type { BoardMemberQueryData } from '@/tanstack-queries/hoa-board'
import { BoardMembersTableActions } from './actions'

/** Who is looking at the table; decides which row actions show. */
export interface BoardViewer {
  id: string
  isAdmin: boolean
  /** Admin or president: can add, edit, and remove members. */
  isManager: boolean
}

const columnHelper = createColumnHelper<DataTableFeatures, BoardMemberQueryData>()

/** Columns need the viewer for the actions cell, so they're built per page. */
export function boardMembersTableColumns(viewer: BoardViewer) {
  return columnHelper.columns([
    columnHelper.accessor('name', {
      id: 'name',
      size: 220,
      header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_name()} />,
      cell: ({ row }) => {
        const { resident } = row.original
        return (
          <div className="flex w-0 min-w-full items-center gap-2">
            {resident ? (
              // The registry has the rest: phone, houses, notes.
              <Link
                to="/residential"
                search={{
                  tab: 'residents',
                  'search-residents': `${resident.firstName} ${resident.lastName}`,
                }}
                className="truncate font-medium hover:underline"
                title={row.original.name}
              >
                {row.original.name}
              </Link>
            ) : (
              <span className="truncate" title={row.original.name}>
                {row.original.name}
              </span>
            )}
            {row.original.id === viewer.id && <Badge variant="info">{m.board_you()}</Badge>}
          </div>
        )
      },
      // Search box target: name or email, accent-insensitive.
      filterFn: (row, _columnId, value: string) => {
        const filterValue = normalizeString(value)
        if (!filterValue) return true
        const haystack = normalizeString(`${row.original.name} ${row.original.resident?.email ?? ''}`)
        return haystack.includes(filterValue)
      },
    }),

    columnHelper.display({
      id: 'roles',
      size: 220,
      header: m.board_roles(),
      cell: ({ row }) => {
        // Fixed order (admin first) regardless of the stored order.
        const roles = APP_ROLES.filter((role) => row.original.roles.includes(role))
        return (
          <div className="flex flex-wrap gap-1">
            {roles.map((role) => (
              <RoleNameBadge key={role} roleName={role} />
            ))}
          </div>
        )
      },
    }),

    columnHelper.display({
      id: 'houses',
      size: 120,
      header: m.common_section_houses(),
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.resident?.propertyLinks.map(({ property }) => (
            <Badge key={property.id} variant="outline">
              {property.number}
            </Badge>
          ))}
        </div>
      ),
    }),

    columnHelper.display({
      id: 'email',
      size: 220,
      header: m.common_field_email(),
      cell: ({ row }) => (
        <span className="block w-0 min-w-full truncate" title={row.original.resident?.email ?? undefined}>
          {row.original.resident?.email}
        </span>
      ),
    }),

    columnHelper.display({
      id: 'actions',
      size: 50,
      cell: ({ row }) => {
        const member = row.original
        const isAdminRow = member.roles.includes('admin')
        // Mirrors the server: nobody manages their own seat; admins only by admins.
        // The main admin, which nobody manages, isn't listed (see boardMembersQuery).
        const canManage = viewer.isManager && member.id !== viewer.id && (viewer.isAdmin || !isAdminRow)

        return canManage ? <BoardMembersTableActions member={member} viewer={viewer} /> : null
      },
    }),
  ])
}
