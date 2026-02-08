import { queryOptions } from '@tanstack/react-query'
import { getNotificationsList } from '@/api/server-functions/notifications'

export const NOTIFICATIONS_QUERY_KEY = 'notifications'

export const notificationsListQueryOptions = () =>
  queryOptions({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: async () => await getNotificationsList(),
    staleTime: 30 * 1000, // 30 seconds
  })
