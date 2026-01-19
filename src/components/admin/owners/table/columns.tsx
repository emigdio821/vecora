import { IconMinus } from '@tabler/icons-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { OwnerWithRelations } from '@/db/schemas/zod'
import { normalizeString } from '@/lib/utils'
import { OwnersTableActions } from './actions'
import { OwnerNameCell } from './owner-name-cell'

export const ownersTableColumns: ColumnDef<OwnerWithRelations>[] = [
  {
    id: 'select',
    enablePinning: false,
    enableResizing: false,
    header: ({ table }) => (
      <Checkbox
        aria-label="Seleccionar todo"
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
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
    header: 'Nombre',
    cell: ({ row }) => <OwnerNameCell owner={row.original} />,
    filterFn: (row, _, value: string) => {
      const normalizedFirstName = normalizeString(row.original.firstName).toLowerCase()
      const normalizedLastName = normalizeString(row.original.lastName).toLowerCase()
      const normalizedValue = normalizeString(value).toLowerCase()

      return (
        normalizedFirstName.includes(normalizedValue) || normalizedLastName.includes(normalizedValue) || false
      )
    },
  },
  {
    accessorKey: 'email',
    header: 'Correo',
    cell: ({ row }) => <span className="block max-w-36 truncate tabular-nums">{row.original.email}</span>,
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
    cell: ({ row }) => <p className="tabular-nums">{row.original.phone}</p>,
  },
  {
    accessorKey: 'houses',
    header: 'Casas',
    cell: ({ row }) => {
      const houses = row.original.houses
      const houseBadges = houses.map((house) => (
        <Badge variant="outline" className="tabular-nums" key={house.id}>
          {house.houseNumber}
        </Badge>
      ))

      return (
        <div className="flex max-w-24 flex-wrap gap-1">
          {houseBadges.length > 0 ? houseBadges : <IconMinus className="size-4" />}
        </div>
      )
    },
  },
  {
    accessorKey: 'violations',
    header: 'Infracciones',
    cell: ({ row }) => {
      const violations = row.original.violations

      return violations.length > 0 ? (
        <Badge variant="error" className="tabular-nums">
          {violations.length}
        </Badge>
      ) : (
        <IconMinus className="size-4" />
      )
    },
  },
  {
    accessorKey: 'payments',
    header: 'Pagos pendientes',
    cell: ({ row }) => {
      const payments = row.original.payments.filter(
        (p) => p.status === 'pending' && p.paymentType !== 'violation',
      )
      return payments.length > 0 ? (
        <Badge variant="error" className="tabular-nums">
          {payments.length}
        </Badge>
      ) : (
        <IconMinus className="size-4" />
      )
    },
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    cell: ({ row }) => <OwnersTableActions owner={row.original} />,
  },
]
