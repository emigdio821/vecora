import { useQuery } from '@tanstack/react-query'
import { currentHoaBoardMembersQueryOptions } from '@/api/tanstack-queries/hoa-board'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { hoaBoardMembersTableColumns } from './columns'
import { MembersDataTableHeader } from './data-table-header'

export function HoaMembersDataTable() {
  const { data: members = [], isLoading, error, refetch } = useQuery(currentHoaBoardMembersQueryOptions())

  if (error) {
    return (
      <TSQueryGenericError
        refetch={refetch}
        errorDescription="Algo salió mal al cargar los miembros de la mesa"
      />
    )
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={members}
      tableId="hoa-board-members"
      columns={hoaBoardMembersTableColumns}
      header={(table) => <MembersDataTableHeader table={table} />}
    />
  )
}
