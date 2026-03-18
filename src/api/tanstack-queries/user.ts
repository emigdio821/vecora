import { queryOptions } from '@tanstack/react-query'
import { getUserProfile } from '@/api/server-functions/user-profile'
import type { SelectProfile } from '@/db/schema/zod/profiles'
import type { SelectResident } from '@/db/schema/zod/residents'
import type { SelectUser } from '@/db/schema/zod/users'

export const USER_PROFILE_QUERY_KEY = 'user-profile'

export type UserProfileQueryData =
  | (SelectProfile & {
      user: SelectUser
      resident: SelectResident | null
    })
  | null

export const userProfileQueryOptions = () =>
  queryOptions({
    queryKey: [USER_PROFILE_QUERY_KEY],
    queryFn: async (): Promise<UserProfileQueryData> => await getUserProfile(),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })
