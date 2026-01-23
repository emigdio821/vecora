import { useQuery } from '@tanstack/react-query'
import { auditLogsListQueryOptions } from '@/api/tanstack-queries/audit-logs'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { FrameTitle } from '@/components/ui/frame'
import { auditLogsTableColumns } from './table/columns'

export function AuditLogsSectionContent() {
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
      // header={(table) => <OwnersDataTableHeader table={table} />}
      header={() => <FrameTitle>Registros de auditoría</FrameTitle>}
    />
  )
}
