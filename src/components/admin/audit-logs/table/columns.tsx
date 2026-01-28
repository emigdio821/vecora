import type { ColumnDef } from '@tanstack/react-table'
import { AuditLogActionBadge } from '@/components/shared/audit-logs/action-badge'
import { AuditLogEntityTypeBadge } from '@/components/shared/audit-logs/identity-type-badge'
import { AuditLogRoleNameBadge } from '@/components/shared/audit-logs/role-name-badge'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import type { AuditLogWithUserAndProfile } from '@/db/schemas/zod/audit-logs'
import { formatDate, normalizeString } from '@/lib/utils'
import { AuditDetailsCell } from './audit-details-cell'
import type { YearFacetedFilterOption } from './data-table-header'

export const auditLogsTableColumns: ColumnDef<AuditLogWithUserAndProfile>[] = [
  {
    id: 'select',
    size: 28,
    enablePinning: false,
    enableResizing: false,
    enableSorting: false,
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
    accessorKey: 'user',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Usuario" />,
    cell: ({ row }) => <AuditDetailsCell auditLogs={row.original} />,
    filterFn: (row, _, value: string) => {
      const normalizedName = normalizeString(row.original.user?.name || '').toLowerCase()
      const normalizedUserId = normalizeString(row.original.user?.id || '').toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return normalizedName.includes(normalizedValue) || normalizedUserId.includes(normalizedValue) || false
    },
  },
  {
    accessorKey: 'user.profile.roles',
    size: 150,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Rol" />,
    cell: ({ row }) => {
      const roles = row.original.profile?.profileRoles?.map(({ role }) => role.name) || []
      const roleBadges = roles.map((role) => <AuditLogRoleNameBadge roleName={role} key={role} />)

      return <>{roleBadges.length > 0 && <div className="flex flex-wrap gap-1">{roleBadges}</div>}</>
    },
  },
  {
    accessorKey: 'action',
    size: 150,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Acción" />,
    cell: ({ row }) => <AuditLogActionBadge action={row.original.action} />,
  },
  {
    accessorKey: 'entityType',
    size: 150,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Tipo de entidad" />,
    cell: ({ row }) => <AuditLogEntityTypeBadge entityType={row.original.entityType} />,
  },
  {
    accessorKey: 'timestamp',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Fecha y hora" />,
    cell: ({ row }) => formatDate(row.original.timestamp, { hour: '2-digit', minute: '2-digit' }),
    filterFn: (row, _, value: YearFacetedFilterOption[]) => {
      if (value.length === 0) return true

      const rowYear = new Date(row.original.timestamp).getFullYear()
      return value.some((option) => option.value === rowYear)
    },
  },
]
