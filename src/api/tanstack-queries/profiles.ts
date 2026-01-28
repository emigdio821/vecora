import { queryOptions } from '@tanstack/react-query'
import { getProfilesList } from '../server-functions/profiles'

export const PROFILES_QUERY_KEY = 'profiles'

export const profilesListQueryOptions = () =>
  queryOptions({
    queryKey: [PROFILES_QUERY_KEY],
    queryFn: async () => await getProfilesList(),
  })
