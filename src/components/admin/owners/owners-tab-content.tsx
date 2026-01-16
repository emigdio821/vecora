import { useQuery } from '@tanstack/react-query'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { ownersListQueryOptions } from '@/lib/ts-queries/owners'
import { ownersTableColumns } from './table/columns'
import { OwnersDataTableHeader } from './table/data-table-header'

export function OwnersTabContent() {
  const { data: owners = [], isLoading, error, refetch } = useQuery(ownersListQueryOptions())

  if (error) {
    return <TSQueryGenericError refetch={refetch} />
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
