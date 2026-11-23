import { createColumnHelper } from '@tanstack/react-table'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { DataTableSortableHeader } from '@/components/shared/table/sortable-header'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { normalizeString } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import type { VehicleQueryData } from '@/tanstack-queries/vehicles'
import { compactPlate, VEHICLE_KIND_ICON, VEHICLE_KIND_LABEL } from '../vehicle'
import { VehiclesTableActions } from './actions'

const columnHelper = createColumnHelper<DataTableFeatures, VehicleQueryData>()

export const vehiclesTableColumns = columnHelper.columns([
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

  columnHelper.accessor('plate', {
    id: 'plate',
    size: 160,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.residential_field_plate()} />,
    cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
    sortFn: (rowA, rowB) => rowA.original.plate.localeCompare(rowB.original.plate, 'es', { numeric: true }),
    // Search box target: the plate or the RFID serial ignoring spaces and dashes,
    // or the house number.
    filterFn: (row, _columnId, value: string) => {
      const filterValue = normalizeString(value)

      if (!filterValue) return true

      const { plate, rfidSerial, property } = row.original
      const compactValue = compactPlate(value)

      return (
        (compactValue !== '' && compactPlate(plate).includes(compactValue)) ||
        (compactValue !== '' && compactPlate(rfidSerial ?? '').includes(compactValue)) ||
        normalizeString(property?.number ?? '').includes(filterValue)
      )
    },
  }),

  columnHelper.accessor((row) => VEHICLE_KIND_LABEL[row.kind], {
    id: 'kind',
    size: 140,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_type()} />,
    cell: ({ row, getValue }) => {
      const Icon = VEHICLE_KIND_ICON[row.original.kind]

      return (
        <Badge variant="outline">
          <Icon />
          {getValue()}
        </Badge>
      )
    },
  }),

  columnHelper.accessor('rfidSerial', {
    id: 'rfid',
    size: 160,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.residential_column_rfid()} />,
    // A vehicle without a tag can't open the gate: worth spotting.
    cell: ({ getValue }) => {
      const rfidSerial = getValue()
      if (!rfidSerial) {
        return <Badge variant="warning">{m.residential_no_rfid()}</Badge>
      }
      return <span className="tabular-nums">{rfidSerial}</span>
    },
    sortFn: (rowA, rowB) =>
      (rowA.original.rfidSerial ?? '').localeCompare(rowB.original.rfidSerial ?? '', 'es', { numeric: true }),
  }),

  columnHelper.accessor((row) => row.property?.number ?? null, {
    id: 'house',
    size: 120,
    header: ({ column }) => <DataTableSortableHeader column={column} title={m.common_field_house()} />,
    cell: ({ getValue }) => {
      const number = getValue()
      if (number === null) {
        return <Badge variant="warning">{m.residential_no_house()}</Badge>
      }
      return <Badge variant="outline">{number}</Badge>
    },
    // "2A" < "10B", like the houses table.
    sortFn: (rowA, rowB) =>
      (rowA.original.property?.number ?? '').localeCompare(rowB.original.property?.number ?? '', 'es', {
        numeric: true,
        sensitivity: 'base',
      }),
  }),

  columnHelper.display({
    id: 'actions',
    size: 50,
    cell: ({ row }) => <VehiclesTableActions vehicle={row.original} />,
  }),
])
