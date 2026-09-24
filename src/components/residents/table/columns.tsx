import { createColumnHelper } from '@tanstack/react-table'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { normalizeString } from '@/lib/utils'
import type { ResidentQueryData } from '@/tanstack-queries/residents'
import { ResidentsTableActions } from './actions'
import { ResidentNameCell } from './resident-name-cell'

const columnHelper = createColumnHelper<DataTableFeatures, ResidentQueryData>()

type Relationship = ResidentQueryData['property_residents'][number]['relationship']

const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  owner: 'Propietario',
  tenant: 'Inquilino',
  family: 'Familiar',
}

/** Highest-ranking relationship a resident has across their properties. */
function primaryRelationship(resident: ResidentQueryData): Relationship | null {
  const relationships = resident.property_residents.map((pr) => pr.relationship)
  if (relationships.includes('owner')) return 'owner'
  if (relationships.includes('tenant')) return 'tenant'
  if (relationships.includes('family')) return 'family'
  return null
}

export const residentsTableColumns = columnHelper.columns([
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
  }),

  columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
    id: 'name',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Nombre" />,
    cell: ({ row }) => <ResidentNameCell resident={row.original} />,
    sortFn: (rowA, rowB) =>
      `${rowA.original.last_name} ${rowA.original.first_name}`.localeCompare(
        `${rowB.original.last_name} ${rowB.original.first_name}`,
        'es',
      ),
    // Search box target: matches name, email or phone, accent-insensitive.
    filterFn: (row, _columnId, value: string) => {
      const filterValue = normalizeString(value)

      if (!filterValue) return true

      const { first_name, last_name, email, phone } = row.original

      return (
        normalizeString(`${first_name} ${last_name}`).includes(filterValue) ||
        normalizeString(email ?? '').includes(filterValue) ||
        normalizeString(phone).includes(filterValue)
      )
    },
  }),

  columnHelper.accessor('email', {
    id: 'email',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Correo" />,
    cell: ({ getValue }) => <span className="truncate">{getValue() ?? '—'}</span>,
  }),

  columnHelper.accessor('phone', {
    id: 'phone',
    size: 180,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Teléfono" />,
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
  }),

  columnHelper.display({
    id: 'properties',
    size: 120,
    enableSorting: false,
    header: 'Casas',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.property_residents.map(({ property, relationship }) => (
          <Badge key={property.id} variant="outline" title={RELATIONSHIP_LABEL[relationship]}>
            {property.number}
          </Badge>
        ))}
      </div>
    ),
  }),

  columnHelper.accessor((row) => primaryRelationship(row), {
    id: 'relationship',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Tipo" />,
    cell: ({ getValue }) => {
      const relationship = getValue()
      return relationship ? (
        <Badge variant="outline">{RELATIONSHIP_LABEL[relationship]}</Badge>
      ) : (
        <Badge variant="warning">Sin casa</Badge>
      )
    },
    filterFn: (row, columnId, filterValues: string[]) => {
      if (!filterValues.length) return true
      return filterValues.includes(String(row.getValue(columnId)))
    },
  }),

  columnHelper.accessor((row) => row.profile?.user_roles[0]?.role ?? null, {
    id: 'role',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Rol" />,
    cell: ({ row, getValue }) => {
      if (!row.original.profile) return <Badge variant="outline">Sin cuenta</Badge>
      const role = getValue()
      return role ? <RoleNameBadge roleName={role} /> : <Badge variant="warning">Sin rol</Badge>
    },
    sortFn: (rowA, rowB) =>
      (rowA.getValue<string | null>('role') ?? '').localeCompare(rowB.getValue<string | null>('role') ?? ''),
  }),

  columnHelper.display({
    id: 'actions',
    size: 50,
    cell: ({ row }) => <ResidentsTableActions resident={row.original} />,
  }),
])
