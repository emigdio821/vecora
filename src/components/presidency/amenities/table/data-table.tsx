import { useQuery } from '@tanstack/react-query'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { amenitiesQueryOptions } from '@/tanstack-queries/presidency'
import { amenitiesTableColumns } from './columns'
import { AmenitiesDataTableHeader } from './data-table-header'

export function AmenitiesDataTable() {
  const { data: amenities = [], isLoading, error, refetch } = useQuery(amenitiesQueryOptions())

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
      emptyMessage="Sin áreas comunes. Agrega la terraza, la alberca o cualquier área que se pueda reservar."
      isLoading={isLoading}
    />
  )
}
