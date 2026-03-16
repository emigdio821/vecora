import { queryOptions } from '@tanstack/react-query'
import { getAuditLogs } from '@/api/server-functions/audit-logs'
import type { SelectAuditLog } from '@/db/schema/zod/audit-logs'
import type { SelectProfile } from '@/db/schema/zod/profiles'
import type { SelectUser } from '@/db/schema/zod/users'

export const AUDIT_LOGS_QUERY_KEY = 'audit-logs'

export type AuditLogQueryData = SelectAuditLog & {
  user: SelectUser | null
  profile: SelectProfile | null
  entityUser: SelectUser | null
}

export const auditLogsListQueryOptions = () =>
  queryOptions({
    queryKey: [AUDIT_LOGS_QUERY_KEY],
    queryFn: async (): Promise<AuditLogQueryData[]> => await getAuditLogs(),
  })
