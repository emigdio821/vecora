import type { ColumnDef } from '@tanstack/react-table'
import { PaymentStatusBadge } from '@/components/shared/payments/status-badge'
import { DataTableSortableHeader } from '@/components/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { PaymentWithOwnerAndMonths } from '@/db/schemas/zod/payments'
import { getAllMonthsMap, getPaymentTypeLabel, normalizeString } from '@/lib/utils'
import { PaymentsTableActions } from './actions'
import { PaymentAmountCell } from './payment-amount-cell'

const MONTHS = getAllMonthsMap()

export const paymentsTableColumns: ColumnDef<PaymentWithOwnerAndMonths>[] = [
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
    accessorKey: 'amount',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Monto" />,
    sortingFn: (rowA, rowB) => Number(rowA.original.amount) - Number(rowB.original.amount),
    cell: ({ row }) => <PaymentAmountCell payment={row.original} />,
    filterFn: (row, _, value: string) => {
      const ownerFullName = row.original.owner
        ? `${row.original.owner.firstName} ${row.original.owner.lastName}`
        : ''
      const normalizedAmount = normalizeString(row.original.amount).toLowerCase()
      const normalizeOwnerFullName = normalizeString(ownerFullName).toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return (
        normalizedAmount.includes(normalizedValue) ||
        normalizeOwnerFullName.includes(normalizedValue) ||
        false
      )
    },
  },
  {
    accessorKey: 'owner',
    size: 300,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Propietario" />,
    cell: ({ row }) => {
      const owner = row.original.owner
      return owner && <p className="truncate">{`${owner.firstName} ${owner.lastName}`}</p>
    },
  },
  {
    accessorKey: 'paymentType',
    size: 150,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Tipo" />,
    cell: ({ row }) => {
      const paymentType = row.original.paymentType
      const paymentTypeLabel = getPaymentTypeLabel(paymentType)

      return <p>{paymentTypeLabel}</p>
    },
  },
  {
    accessorKey: 'status',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Estado" />,
    cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
  },
  {
    accessorKey: 'paymentMonths',
    size: 240,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Meses" />,
    cell: ({ row }) => {
      const paymentMonths = row.original.paymentMonths
      const showMonthlyFee = row.original.paymentType === 'monthly_fee' && paymentMonths.length > 0

      if (!showMonthlyFee) return null
      if (paymentMonths.length === 12) return <Badge variant="outline">Todo el año</Badge>

      const paymentMonthsBadges = paymentMonths.map((month) => (
        <Badge variant="outline" key={`${month.month}-${month.paymentId}`}>
          <span>{MONTHS[month.month]}</span>
        </Badge>
      ))

      return (
        <>
          {paymentMonthsBadges.length > 0 && (
            <div className="flex flex-wrap gap-1">{paymentMonthsBadges}</div>
          )}
        </>
      )
    },
  },
  {
    accessorKey: 'year',
    size: 80,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Año" />,
    cell: ({ row }) => <p>{row.original.year}</p>,
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    size: 55,
    cell: ({ row }) => <PaymentsTableActions payment={row.original} />,
  },
]
