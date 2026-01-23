import { queryOptions } from '@tanstack/react-query'
import { getAuditLogs } from '@/api/server-functions/audit-logs'

export const AUDIT_LOGS_QUERY_KEY = 'audit-logs'

export const auditLogsListQueryOptions = () =>
  queryOptions({
    queryKey: [AUDIT_LOGS_QUERY_KEY],
    queryFn: async () => await getAuditLogs(),
  })
