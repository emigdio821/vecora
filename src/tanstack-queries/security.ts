import { queryOptions } from '@tanstack/react-query'
import { fetchSecurityRequests } from '@/server-actions/security'

export const SECURITY_QUERY_KEY = 'security'

export type SecurityRequestQueryData = Awaited<ReturnType<typeof fetchSecurityRequests>>[number]

export const securityRequestsQueryOptions = queryOptions({
  queryKey: [SECURITY_QUERY_KEY, 'requests'],
  queryFn: () => fetchSecurityRequests(),
})
