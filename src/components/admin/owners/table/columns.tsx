import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { OwnerWithRelations } from '@/db/schemas/zod'
import { OwnersTableActions } from './actions'

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
    cell: ({ row }) => {
      const firstName = row.original.firstName
      const lastName = row.original.lastName

      return `${firstName} ${lastName}`
    },
  },
  {
    accessorKey: 'email',
    header: 'Correo',
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono',
  },
  {
    accessorKey: 'houses',
    header: 'Casas',
    cell: ({ row }) => {
      const houses = row.original.houses
      const houseBadges = houses.map((house) => (
        <Badge variant="secondary" key={house.id}>
          {house.houseNumber}
        </Badge>
      ))

      return houseBadges.length > 0 ? houseBadges : 'Sin casas asignadas'
    },
  },
  {
    accessorKey: 'violations',
    header: 'Infracciones',
    cell: ({ row }) => {
      const violations = row.original.violations
      return violations.length > 0 ? violations.length : 'Sin infracciones'
    },
  },
  {
    accessorKey: 'payments',
    header: 'Pagos pendientes',
    cell: ({ row }) => {
      const payments = row.original.payments.filter((p) => p.status === 'pending')
      return payments.length > 0 ? payments.length : 'Sin pagos pendientes'
    },
  },
  {
    id: 'actions',
    enablePinning: false,
    enableResizing: false,
    cell: ({ row }) => <OwnersTableActions owner={row.original} />,
  },
  // {
  //   accessorKey: 'createdAt',
  //   header: 'Fecha de creación',
  //   cell: ({ row }) => {
  //     const createdAt = row.original.createdAt

  //     return new Date(createdAt).toLocaleDateString(undefined, {
  //       year: 'numeric',
  //       month: 'short',
  //       day: '2-digit',
  //     })
  //   },
  // },
]
