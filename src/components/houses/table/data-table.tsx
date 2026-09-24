import { useQuery } from '@tanstack/react-query'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/shared/table/data-table'
import { housesListQueryOptions } from '@/tanstack-queries/houses'
import { housesTableColumns } from './columns'
import { HousesDataTableHeader } from './data-table-header'

export function HousesDataTable() {
  const { data: houses = [], isLoading, error, refetch } = useQuery(housesListQueryOptions())

  if (error) {
    return <TanstackQueryError refetch={refetch} errorDescription="Algo salió mal al cargar las casas" />
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={houses}
      tableId="houses"
      columns={housesTableColumns}
      getRowId={(house) => house.id}
      initialSorting={[{ id: 'number', desc: false }]}
      header={(table) => <HousesDataTableHeader table={table} />}
    />
  )
}
