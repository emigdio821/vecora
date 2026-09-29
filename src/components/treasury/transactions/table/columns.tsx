import { createColumnHelper } from '@tanstack/react-table'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn, formatCurrency, formatDay, normalizeString } from '@/lib/utils'
import type { TransactionQueryData } from '@/tanstack-queries/treasury'
import { PAYMENT_METHOD_LABEL } from '../../kind'
import { TransactionsTableActions } from './actions'
import { TransactionDescriptionCell } from './transaction-description-cell'

const columnHelper = createColumnHelper<DataTableFeatures, TransactionQueryData>()

export const transactionsTableColumns = columnHelper.columns([
  columnHelper.display({
    id: 'select',
    size: 28,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Seleccionar todo"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()}
        disabled={table.getFilteredRowModel().rows.length === 0}
        onCheckedChange={(value) => {
          table.toggleAllPageRowsSelected(!!value)
        }}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Seleccionar elemento"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value)
        }}
      />
    ),
  }),

  columnHelper.accessor('occurred_on', {
    id: 'occurred_on',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Fecha" />,
    cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums">{formatDay(getValue())}</span>,
  }),

  columnHelper.accessor('description', {
    id: 'description',
    size: 320,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Concepto" />,
    cell: ({ row }) => <TransactionDescriptionCell transaction={row.original} />,
    // Search box target: concept, folio, reference, category or house, accent-insensitive.
    filterFn: (row, _columnId, value: string) => {
      const filterValue = normalizeString(value)
      if (!filterValue) return true

      const { description, folio, reference, category, property } = row.original
      return [description, folio, reference, category.name, property && `casa ${property.number}`].some(
        (field) => field && normalizeString(field).includes(filterValue),
      )
    },
  }),

  columnHelper.accessor((row) => row.category.name, {
    id: 'category',
    size: 180,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Categoría" />,
    cell: ({ getValue }) => <Badge variant="outline">{getValue()}</Badge>,
  }),

  columnHelper.accessor((row) => row.property?.number ?? '', {
    id: 'property',
    size: 110,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Casa" />,
    cell: ({ row }) => row.original.property?.number ?? null,
    sortFn: (rowA, rowB) =>
      (rowA.original.property?.number ?? '').localeCompare(rowB.original.property?.number ?? '', 'es', {
        numeric: true,
        sensitivity: 'base',
      }),
  }),

  columnHelper.accessor('payment_method', {
    id: 'payment_method',
    size: 130,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Método" />,
    cell: ({ getValue }) => PAYMENT_METHOD_LABEL[getValue()],
  }),

  columnHelper.accessor((row) => Number(row.amount), {
    id: 'amount',
    size: 130,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Monto" className="justify-end" />,
    cell: ({ row, getValue }) => {
      const isIncome = row.original.kind === 'income'
      return (
        <span
          className={cn(
            'block text-right whitespace-nowrap tabular-nums',
            isIncome ? 'text-success-foreground' : 'text-destructive-foreground',
          )}
        >
          {isIncome ? '+' : '−'}
          {formatCurrency(getValue())}
        </span>
      )
    },
  }),

  columnHelper.display({
    id: 'actions',
    size: 50,
    cell: ({ row }) => <TransactionsTableActions transaction={row.original} />,
  }),
])
