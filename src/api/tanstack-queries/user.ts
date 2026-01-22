import { queryOptions } from '@tanstack/react-query'
import { getUserProfile } from '@/api/server-functions/user-profile'

export const USER_PROFILE_QUERY_KEY = 'user-profile'

export const userProfileQueryOptions = () =>
  queryOptions({
    queryKey: [USER_PROFILE_QUERY_KEY],
    queryFn: async () => await getUserProfile(),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })
