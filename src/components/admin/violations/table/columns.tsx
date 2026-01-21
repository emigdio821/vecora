import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { ViolationWithOwner } from '@/db/schemas/zod'
import { cn, formatDate, normalizeString } from '@/lib/utils'
import { ViolationsTableActions } from './actions'
import { ViolationConceptCell } from './violation-concept-cell'

export const violationsTableColumns: ColumnDef<ViolationWithOwner>[] = [
  {
    id: 'select',
    enablePinning: false,
    enableResizing: false,
    enableSorting: false,
    size: 28,
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected()
      const isSomeSelected = table.getIsSomePageRowsSelected()
      return (
        <Checkbox
          aria-label="Select all rows"
          checked={isAllSelected}
          indeterminate={isSomeSelected && !isAllSelected}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      )
    },
  },
  {
    accessorKey: 'concept',
    header: 'Concepto',
    size: 280,
    cell: ({ row }) => <ViolationConceptCell violation={row.original} />,
    filterFn: (row, _, value: string) => {
      const ownerFullName = row.original.owner
        ? `${row.original.owner.firstName} ${row.original.owner.lastName}`
        : ''
      const normalizedConcept = normalizeString(row.original.concept).toLowerCase()
      const normalizeOwnerFullName = normalizeString(ownerFullName).toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return (
        normalizedConcept.includes(normalizedValue) ||
        normalizeOwnerFullName.includes(normalizedValue) ||
        false
      )
    },
  },
  {
    accessorKey: 'owner',
    header: 'Propietario',
    size: 200,
    cell: ({ row }) => {
      const owner = row.original.owner
      return owner && <p className="truncate">{`${owner.firstName} ${owner.lastName}`}</p>
    },
  },
  {
    accessorKey: 'amount',
    header: 'Monto',
    size: 100,
    cell: ({ row }) => <p>${row.original.amount}</p>,
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    size: 120,
    cell: ({ row }) => {
      const isPaid = row.original.status === 'paid'

      return (
        <Badge variant="outline">
          <span aria-hidden className={cn('size-1.5 rounded-full', isPaid ? 'bg-success' : 'bg-warning')} />
          {isPaid ? 'Pagada' : 'Pendiente'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'violationDate',
    header: 'Fecha',
    size: 150,
    cell: ({ row }) => <p>{formatDate(row.original.violationDate)}</p>,
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    size: 28,
    cell: ({ row }) => <ViolationsTableActions violation={row.original} />,
  },
]
