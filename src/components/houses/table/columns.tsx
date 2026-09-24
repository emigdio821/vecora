import { createColumnHelper } from '@tanstack/react-table'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { normalizeString } from '@/lib/utils'
import type { HouseQueryData } from '@/tanstack-queries/houses'
import { RELATIONSHIP_LABEL } from '../relationship'
import { HousesTableActions } from './actions'
import { HouseNumberCell } from './house-number-cell'

const columnHelper = createColumnHelper<DataTableFeatures, HouseQueryData>()

function residentName(resident: { first_name: string; last_name: string }) {
  return `${resident.first_name} ${resident.last_name}`
}

function owners(house: HouseQueryData) {
  return house.property_residents.filter((pr) => pr.relationship === 'owner').map((pr) => pr.resident)
}

export const housesTableColumns = columnHelper.columns([
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

  columnHelper.accessor('number', {
    id: 'number',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Casa" />,
    cell: ({ row }) => <HouseNumberCell house={row.original} />,
    // "2A" < "10B": compare numerically where possible.
    sortFn: (rowA, rowB) =>
      rowA.original.number.localeCompare(rowB.original.number, 'es', { numeric: true, sensitivity: 'base' }),
    // Search box target: matches number or any linked resident, accent-insensitive.
    filterFn: (row, _columnId, value: string) => {
      const filterValue = normalizeString(value)

      if (!filterValue) return true

      const { number, property_residents } = row.original

      return (
        normalizeString(number).includes(filterValue) ||
        property_residents.some((pr) => normalizeString(residentName(pr.resident)).includes(filterValue))
      )
    },
  }),

  columnHelper.display({
    id: 'owners',
    size: 220,
    enableSorting: false,
    header: 'Propietarios',
    cell: ({ row }) => {
      const houseOwners = owners(row.original)

      return houseOwners.length ? (
        <div className="flex flex-wrap gap-1">
          {houseOwners.map((owner) => (
            <Badge key={owner.id} variant="outline">
              {residentName(owner)}
            </Badge>
          ))}
        </div>
      ) : (
        <Badge variant="warning">Sin propietario</Badge>
      )
    },
  }),

  columnHelper.display({
    id: 'residents',
    size: 220,
    enableSorting: false,
    header: 'Residentes',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.property_residents.map(({ resident, relationship }) => (
          <Badge key={resident.id} variant="outline" title={RELATIONSHIP_LABEL[relationship]}>
            {residentName(resident)}
          </Badge>
        ))}
      </div>
    ),
  }),

  columnHelper.accessor((row) => row.property_residents.length, {
    id: 'residents_count',
    size: 100,
    header: ({ column }) => <DataTableSortableHeader column={column} title="Personas" />,
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
  }),

  columnHelper.display({
    id: 'actions',
    size: 50,
    cell: ({ row }) => <HousesTableActions house={row.original} />,
  }),
])
