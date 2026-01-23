import { useQuery } from '@tanstack/react-query'
import { auditLogsListQueryOptions } from '@/api/tanstack-queries/audit-logs'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { auditLogsTableColumns } from './table/columns'
import { AuditLogsDataTableHeader } from './table/data-table-header'

export function AuditLogsTabContent() {
  const { data: auditLogs = [], isLoading, error, refetch } = useQuery(auditLogsListQueryOptions())

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
      data={auditLogs}
      tableId="audit-logs"
      pageSize={5}
      columns={auditLogsTableColumns}
      header={(table) => <AuditLogsDataTableHeader table={table} />}
    />
  )
}
