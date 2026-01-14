import { queryOptions } from '@tanstack/react-query'
import { getUserProfile } from '@/server-fns/user-profile'

export const USER_PROFILE_QUERY_KEY = 'user-profile'

export const userProfileQueryOptions = () =>
  queryOptions({
    queryKey: [USER_PROFILE_QUERY_KEY],
    queryFn: getUserProfile,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })
