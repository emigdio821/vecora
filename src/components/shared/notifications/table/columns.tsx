import type { ColumnDef } from '@tanstack/react-table'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Checkbox } from '@/components/ui/checkbox'
import type { SelectNotification } from '@/db/schema/zod/notifications'
import { formatDate, normalizeString } from '@/lib/utils'
import { NotificationsTableActions } from './actions'
import { NotificationTitleCell } from './notification-title-cell'

export const notificationsTableColumns: ColumnDef<SelectNotification>[] = [
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
    accessorKey: 'title',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Título" />,
    size: 180,
    cell: ({ row }) => <NotificationTitleCell notification={row.original} />,
    filterFn: (row, _, value: string) => {
      const normalizedTitle = normalizeString(row.original.title).toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()
      return normalizedTitle.includes(normalizedValue)
    },
  },
  {
    accessorKey: 'message',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Mensaje" />,
    size: 300,
    cell: ({ row }) => (
      <p className="line-clamp-2 whitespace-normal text-muted-foreground">{row.original.message}</p>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Creación" />,
    size: 140,
    cell: ({ row }) => <p className="text-left">{formatDate(row.original.createdAt)}</p>,
  },
  {
    accessorKey: 'expiresAt',
    header: ({ column }) => <DataTableSortableHeader column={column} title="Expiración" />,
    size: 140,
    cell: ({ row }) => (
      <p className="text-left">{row.original.expiresAt ? formatDate(row.original.expiresAt) : 'No expira'}</p>
    ),
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    size: 55,
    cell: ({ row }) => <NotificationsTableActions notification={row.original} />,
  },
]
