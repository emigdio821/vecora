import { useQuery } from '@tanstack/react-query'
import { housesListQueryOptions } from '@/api/tanstack-queries/houses'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { housesTableColumns } from './columns'
import { HousesDataTableHeader } from './data-table-header'

export function HousesDataTable() {
  const { data: houses = [], isLoading, error, refetch } = useQuery(housesListQueryOptions())

  if (error) {
    return <TSQueryGenericError refetch={refetch} errorDescription="Algo salió mal al cargar las casas." />
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={houses}
      tableId="houses"
      columns={housesTableColumns}
      header={(table) => <HousesDataTableHeader table={table} />}
    />
  )
}
