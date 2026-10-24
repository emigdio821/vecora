import { queryOptions } from '@tanstack/react-query'
import { fetchMaintenanceRequests } from '@/server-actions/maintenance'

export const MAINTENANCE_QUERY_KEY = 'maintenance'

export type MaintenanceRequestQueryData = Awaited<ReturnType<typeof fetchMaintenanceRequests>>[number]

export const maintenanceRequestsQueryOptions = queryOptions({
  queryKey: [MAINTENANCE_QUERY_KEY, 'requests'],
  queryFn: () => fetchMaintenanceRequests(),
})
