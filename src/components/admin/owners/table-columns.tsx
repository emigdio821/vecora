import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import type { OwnerWithRelations } from '@/db/schemas/zod'

export const ownersTableColumns: ColumnDef<OwnerWithRelations>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
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
