import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { m } from '@/paraglide/messages'
import { maintenanceRequestsQueryOptions } from '@/tanstack-queries/maintenance'
import { type MaintenanceViewer, requestsTableColumns } from './columns'
import { RequestsDataTableHeader, useStatusFilter } from './data-table-header'

interface RequestsDataTableProps {
  viewer: MaintenanceViewer
}

export function RequestsDataTable({ viewer }: RequestsDataTableProps) {
  const { data: requests = [], isLoading, error, refetch } = useQuery(maintenanceRequestsQueryOptions())
  const [status] = useStatusFilter()
  const columns = useMemo(() => requestsTableColumns(viewer), [viewer])

  // Filter the data (not a column) so pagination counts only the visible status.
  const visible = useMemo(
    () => (status === 'all' ? requests : requests.filter((r) => r.status === status)),
    [requests, status],
  )

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={visible}
      tableId="requests"
      columns={columns}
      getRowId={(request) => request.id}
      initialSorting={[{ id: 'requested_on', desc: true }]}
      header={(table) => <RequestsDataTableHeader table={table} viewer={viewer} isLoading={isLoading} />}
      emptyMessage={m.requests_empty()}
      isLoading={isLoading}
    />
  )
}
