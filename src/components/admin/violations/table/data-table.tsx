import { useQuery } from '@tanstack/react-query'
import { violationsListQueryOptions } from '@/api/tanstack-queries/violations'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { violationsTableColumns } from './columns'
import { ViolationsDataTableHeader } from './data-table-header'

export function ViolationsDataTable() {
  const { data: violations = [], isLoading, error, refetch } = useQuery(violationsListQueryOptions())

  if (error) {
    return (
      <TSQueryGenericError refetch={refetch} errorDescription="Algo salió mal al cargar las infracciones" />
    )
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={violations}
      tableId="violations"
      columns={violationsTableColumns}
      header={(table) => <ViolationsDataTableHeader table={table} />}
    />
  )
}
