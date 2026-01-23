import type { ColumnDef } from '@tanstack/react-table'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import type { AuditLogWithUser } from '@/db/schemas/zod/audit-logs'
// import { Checkbox } from '@/components/ui/checkbox'
import { formatDate, normalizeString } from '@/lib/utils'
import { AuditDetailsCell } from './audit-details-cell'

export const auditLogsTableColumns: ColumnDef<AuditLogWithUser>[] = [
  // {
  //   id: 'select',
  //   enablePinning: false,
  //   enableResizing: false,
  //   enableSorting: false,
  //   size: 28,
  //   header: ({ table }) => (
  //     <Checkbox
  //       aria-label="Seleccionar todo"
  //       checked={table.getIsAllPageRowsSelected()}
  //       indeterminate={table.getIsSomePageRowsSelected()}
  //       disabled={table.getFilteredRowModel().rows.length === 0}
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       aria-label="Seleccionar elemento"
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //     />
  //   ),
  // },
  {
    accessorKey: 'user',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Usuario" />,
    size: 200,
    cell: ({ row }) => <AuditDetailsCell auditLogs={row.original} />,
    filterFn: (row, _, value: string) => {
      const normalizedName = normalizeString(row.original.user?.name || '').toLowerCase()
      const normalizedUserId = normalizeString(row.original.user?.id || '').toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return normalizedName.includes(normalizedValue) || normalizedUserId.includes(normalizedValue) || false
    },
  },
  {
    accessorKey: 'action',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Acción" />,
    size: 150,
  },
  {
    accessorKey: 'entityType',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Tipo de entidad" />,
    size: 150,
  },
  {
    accessorKey: 'timestamp',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Fecha y hora" />,
    cell: ({ row }) => formatDate(row.original.timestamp),
  },
]
