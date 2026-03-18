import { useQuery } from '@tanstack/react-query'
import { residentsListQueryOptions } from '@/api/tanstack-queries/residents'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { residentsTableColumns } from './columns'
import { ResidentsDataTableHeader } from './data-table-header'

export function ResidentsDataTable() {
  const { data: residents = [], isLoading, error, refetch } = useQuery(residentsListQueryOptions())

  if (error) {
    return (
      <TSQueryGenericError refetch={refetch} errorDescription="Algo salió mal al cargar los residentes" />
    )
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={residents}
      tableId="residents"
      columns={residentsTableColumns}
      header={(table) => <ResidentsDataTableHeader table={table} />}
    />
  )
}
