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
    columnHelper.accessor('full_name', {
      id: 'full_name',
      size: 220,
      header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_name()} />,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="truncate">{row.original.full_name}</span>
          {row.original.id === viewer.id && <Badge variant="info">{m.board_you()}</Badge>}
        </div>
      ),
      // Search box target: name or email, accent-insensitive.
      filterFn: (row, _columnId, value: string) => {
        const filterValue = normalizeString(value)
        if (!filterValue) return true
        const haystack = normalizeString(`${row.original.full_name} ${row.original.resident?.email ?? ''}`)
        return haystack.includes(filterValue)
      },
    }),

    columnHelper.display({
      id: 'roles',
      size: 220,
      header: m.board_roles(),
      cell: ({ row }) => {
        // Fixed order (admin first) regardless of insertion order.
        const roles = APP_ROLES.filter((role) => row.original.user_roles.some((r) => r.role === role))
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
          {row.original.resident?.property_residents.map(({ property }) => (
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
      cell: ({ row }) => <span className="truncate">{row.original.resident?.email}</span>,
    }),

    columnHelper.display({
      id: 'actions',
      size: 50,
      cell: ({ row }) => {
        const member = row.original
        const isAdminRow = member.user_roles.some((r) => r.role === 'admin')
        // Mirrors the server: nobody manages their own seat or the main admin's;
        // admins only by admins.
        const canManage =
          viewer.isManager &&
          member.id !== viewer.id &&
          !member.is_main_admin &&
          (viewer.isAdmin || !isAdminRow)

        return canManage ? <BoardMembersTableActions member={member} viewer={viewer} /> : null
      },
    }),
  ])
}
