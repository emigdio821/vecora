import { queryOptions } from '@tanstack/react-query'
import { fetchCurrentUser, fetchSettings } from '@/server-actions/session'
import { SETTINGS_QUERY_KEY } from './settings'

export const USER_QUERY_KEY = 'user'

/**
 * The route guards read the user on every navigation, from the cache once
 * it's there (see routes/__root.tsx). Signing in or out removes it.
 */
export const currentUserQueryOptions = queryOptions({
  queryKey: [USER_QUERY_KEY],
  queryFn: () => fetchCurrentUser(),
})

export const settingsQueryOptions = queryOptions({
  queryKey: [SETTINGS_QUERY_KEY, 'row'],
  queryFn: () => fetchSettings(),
  staleTime: 60 * 1000,
})
