import { queryOptions } from '@tanstack/react-query'
import type { SelectHoaBoard } from '@/db/schema/zod/hoa-board'
import type { SelectProfile } from '@/db/schema/zod/profiles'
import type { SelectResident } from '@/db/schema/zod/residents'
import type { SelectUser } from '@/db/schema/zod/users'
import { getProfilesList } from '../server-functions/profiles'

export const PROFILES_QUERY_KEY = 'profiles'

export type ProfileQueryData = SelectProfile & {
  user: SelectUser
  resident: SelectResident | null
  hoaBoardMemberships: SelectHoaBoard[]
}

export const profilesListQueryOptions = () =>
  queryOptions({
    queryKey: [PROFILES_QUERY_KEY],
    queryFn: async (): Promise<ProfileQueryData[]> => await getProfilesList(),
  })
