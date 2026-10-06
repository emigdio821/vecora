import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { m } from '@/paraglide/messages'
import { securityRequestsQueryOptions } from '@/tanstack-queries/security'
import { requestsTableColumns, type SecurityViewer } from './columns'
import { RequestsDataTableHeader, useKindFilter, useStatusFilter } from './data-table-header'

interface RequestsDataTableProps {
  viewer: SecurityViewer
}

export function RequestsDataTable({ viewer }: RequestsDataTableProps) {
  const { data: requests = [], isLoading, error, refetch } = useQuery(securityRequestsQueryOptions())
  const [status] = useStatusFilter()
  const [kind] = useKindFilter()
  const columns = useMemo(() => requestsTableColumns(viewer), [viewer])

  // Filter the data (not a column) so pagination counts only the visible rows.
  const visible = useMemo(
    () =>
      requests.filter(
        (r) => (status === 'all' || r.status === status) && (kind === 'all' || r.kind === kind),
      ),
    [requests, status, kind],
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
