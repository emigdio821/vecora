import { createColumnHelper } from '@tanstack/react-table'
import { RELATIONSHIP_LABEL, sortByRelationship } from '@/components/houses/relationship'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { normalizeString } from '@/lib/utils'
import type { Relationship } from '@/lib/validations/houses'
import { m } from '@/paraglide/messages'
import type { ResidentQueryData } from '@/tanstack-queries/residents'
import { ResidentsTableActions } from './actions'
import { ResidentNameCell } from './resident-name-cell'

const columnHelper = createColumnHelper<DataTableFeatures, ResidentQueryData>()

/** Highest-ranking relationship a resident has across their properties. */
function primaryRelationship(resident: ResidentQueryData): Relationship | null {
  const [first] = sortByRelationship(resident.propertyLinks)
  return first ? first.relationship : null
}

export const residentsTableColumns = columnHelper.columns([
  columnHelper.display({
    id: 'select',
    size: 34,
    enableSorting: false,
    header: ({ table }) => (
      <Checkbox
        aria-label={m.common_select_all()}
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
        aria-label={m.common_select_row()}
        checked={row.getIsSelected()}
        onCheckedChange={(value) => {
          row.toggleSelected(!!value)
        }}
      />
    ),
  }),

  columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
    id: 'name',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_name()} />,
    cell: ({ row }) => <ResidentNameCell resident={row.original} />,
    sortFn: (rowA, rowB) =>
      `${rowA.original.lastName} ${rowA.original.firstName}`.localeCompare(
        `${rowB.original.lastName} ${rowB.original.firstName}`,
        'es',
      ),
    // Search box target: matches name, email or phone, accent-insensitive.
    filterFn: (row, _columnId, value: string) => {
      const filterValue = normalizeString(value)

      if (!filterValue) return true

      const { firstName, lastName, email, phone } = row.original

      return (
        normalizeString(`${firstName} ${lastName}`).includes(filterValue) ||
        normalizeString(email ?? '').includes(filterValue) ||
        normalizeString(phone).includes(filterValue)
      )
    },
  }),

  columnHelper.accessor('email', {
    id: 'email',
    size: 200,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_email()} />,
    cell: ({ getValue }) => {
      const email = getValue()
      if (!email) return null

      return <span className="block w-0 min-w-full truncate">{email}</span>
    },
  }),

  columnHelper.accessor('phone', {
    id: 'phone',
    size: 180,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_phone()} />,
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
  }),

  columnHelper.display({
    id: 'properties',
    size: 120,
    enableSorting: false,
    header: () => m.common_section_houses(),
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.propertyLinks.map(({ property }) => (
          <Badge key={property.id} variant="outline">
            {property.number}
          </Badge>
        ))}
      </div>
    ),
  }),

  columnHelper.accessor((row) => primaryRelationship(row), {
    id: 'relationship',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_type()} />,
    cell: ({ getValue }) => {
      const relationship = getValue()
      return relationship ? (
        <Badge variant="outline">{RELATIONSHIP_LABEL[relationship]}</Badge>
      ) : (
        <Badge variant="warning">{m.residential_no_house()}</Badge>
      )
    },
    filterFn: (row, columnId, filterValues: string[]) => {
      if (!filterValues.length) return true
      return filterValues.includes(String(row.getValue(columnId)))
    },
  }),

  columnHelper.accessor((row) => row.account?.roles[0] ?? null, {
    id: 'role',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.residential_column_role()} />,
    cell: ({ row, getValue }) => {
      if (!row.original.account) return <Badge variant="outline">{m.residential_no_account()}</Badge>
      const role = getValue()
      return role ? (
        <RoleNameBadge roleName={role} />
      ) : (
        <Badge variant="warning">{m.residential_no_role()}</Badge>
      )
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
