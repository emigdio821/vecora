import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCan } from '@/components/current-user-provider'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { m } from '@/paraglide/messages'
import { type VehicleQueryData, vehiclesListQueryOptions } from '@/tanstack-queries/vehicles'
import { vehiclesTableColumns } from './columns'
import { VehiclesDataTableHeader } from './data-table-header'

// Same array on every render while loading, so the table doesn't recompute its rows.
const EMPTY_VEHICLES: VehicleQueryData[] = []

export function VehiclesDataTable() {
  const { data: vehicles = EMPTY_VEHICLES, isLoading, error, refetch } = useQuery(vehiclesListQueryOptions)
  const canManage = useCan({ registry: ['write'] })
  // Selection only feeds bulk delete, and the row menu only edits and deletes,
  // so readers get neither.
  const columns = useMemo(
    () =>
      canManage
        ? vehiclesTableColumns
        : vehiclesTableColumns.filter((column) => column.id !== 'select' && column.id !== 'actions'),
    [canManage],
  )

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={vehicles}
      tableId="vehicles"
      columns={columns}
      getRowId={(vehicle) => vehicle.id}
      initialSorting={[{ id: 'plate', desc: false }]}
      header={(table) => <VehiclesDataTableHeader table={table} isLoading={isLoading} />}
      emptyMessage={m.residential_vehicles_empty()}
      isLoading={isLoading}
    />
  )
}
