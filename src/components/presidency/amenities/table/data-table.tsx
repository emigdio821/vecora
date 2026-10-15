import { useQuery } from '@tanstack/react-query'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { m } from '@/paraglide/messages'
import { type AmenityQueryData, amenitiesQueryOptions } from '@/tanstack-queries/presidency'
import { amenitiesTableColumns } from './columns'
import { AmenitiesDataTableHeader } from './data-table-header'

// Same array on every render while loading, so the table doesn't recompute its rows.
const EMPTY_AMENITIES: AmenityQueryData[] = []

export function AmenitiesDataTable() {
  const { data: amenities = EMPTY_AMENITIES, isLoading, error, refetch } = useQuery(amenitiesQueryOptions())

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={amenities}
      tableId="amenities"
      columns={amenitiesTableColumns}
      getRowId={(amenity) => amenity.id}
      // No initial sort: the query already orders by name.
      header={(table) => <AmenitiesDataTableHeader table={table} isLoading={isLoading} />}
      emptyMessage={m.presidency_amenities_empty()}
      isLoading={isLoading}
    />
  )
}
