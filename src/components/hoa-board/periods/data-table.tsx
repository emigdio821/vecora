import { useQuery } from '@tanstack/react-query'
import { hoaBoardPeriodsListQueryOptions } from '@/api/tanstack-queries/hoa-board'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { hoaBoardPeriodsTableColumns } from './table/columns'
import { PeriodsDataTableHeader } from './table/data-table-header'

export function HoaPeriodsDataTable() {
  const { data: periods = [], isLoading, error, refetch } = useQuery(hoaBoardPeriodsListQueryOptions())

  if (error) {
    return (
      <TSQueryGenericError
        refetch={refetch}
        errorDescription="Algo salió mal al cargar los periodos de la mesa."
      />
    )
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={periods}
      tableId="hoa-board-periods"
      columns={hoaBoardPeriodsTableColumns}
      header={(table) => <PeriodsDataTableHeader table={table} />}
    />
  )
}
