import { queryOptions } from '@tanstack/react-query'
import { getMyNotificationsList, getNotificationsList } from '@/api/server-functions/notifications'

export const NOTIFICATIONS_QUERY_KEY = 'notifications'
export const MY_NOTIFICATIONS_QUERY_KEY = 'my-notifications'

export const notificationsListQueryOptions = () =>
  queryOptions({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: async () => await getNotificationsList(),
    staleTime: 30 * 1000, // 30 seconds
  })

export const myNotificationsListQueryOptions = () =>
  queryOptions({
    queryKey: [MY_NOTIFICATIONS_QUERY_KEY],
    queryFn: async () => await getMyNotificationsList(),
    staleTime: 30 * 1000, // 30 seconds
  })
