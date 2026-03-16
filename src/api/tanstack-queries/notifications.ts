import { queryOptions } from '@tanstack/react-query'
import { getMyNotificationsList, getNotificationsList } from '@/api/server-functions/notifications'
import type { SelectNotification } from '@/db/schema/zod/notifications'
import type { SelectProfile } from '@/db/schema/zod/profiles'
import type { SelectUser } from '@/db/schema/zod/users'

export const NOTIFICATIONS_QUERY_KEY = 'notifications'
export const MY_NOTIFICATIONS_QUERY_KEY = 'my-notifications'

export type NotificationQueryData = SelectNotification & {
  profile: (SelectProfile & { user: SelectUser }) | null
}

export const notificationsListQueryOptions = () =>
  queryOptions({
    queryKey: [NOTIFICATIONS_QUERY_KEY],
    queryFn: async (): Promise<NotificationQueryData[]> => await getNotificationsList(),
    staleTime: 30 * 1000, // 30 seconds
  })

export const myNotificationsListQueryOptions = () =>
  queryOptions({
    queryKey: [MY_NOTIFICATIONS_QUERY_KEY],
    queryFn: async (): Promise<NotificationQueryData[]> => await getMyNotificationsList(),
    staleTime: 30 * 1000, // 30 seconds
  })
