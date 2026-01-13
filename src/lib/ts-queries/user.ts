import { queryOptions } from '@tanstack/react-query'
import axios from 'axios'
import type { ProfileResponse } from '@/db/schemas/zod'

export const USER_PROFILE_QUERY_KEY = 'user_profile'

export const userProfileQueryOptions = () =>
  queryOptions({
    queryKey: [USER_PROFILE_QUERY_KEY],
    queryFn: async () => {
      const { data } = await axios.get<ProfileResponse>('/api/user/profile')
      return data
    },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })
