import { useQuery } from '@tanstack/react-query'
import { ownersListQueryOptions } from '@/api/tanstack-queries/owners'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { ownersTableColumns } from './columns'
import { OwnersDataTableHeader } from './data-table-header'

export function OwnersTabDataTable() {
  const { data: owners = [], isLoading, error, refetch } = useQuery(ownersListQueryOptions())

  if (error) {
    return (
      <TSQueryGenericError refetch={refetch} errorDescription="Algo salió mal al cargar los propietarios." />
    )
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={owners}
      tableId="owners"
      columns={ownersTableColumns}
      header={(table) => <OwnersDataTableHeader table={table} />}
    />
  )
}
