import { queryOptions } from '@tanstack/react-query'
import { getProfilesList, getRolesList } from '../server-functions/profiles'

export const PROFILES_QUERY_KEY = 'profiles'
export const ROLES_QUERY_KEY = 'profile-roles'

export const profilesListQueryOptions = () =>
  queryOptions({
    queryKey: [PROFILES_QUERY_KEY],
    queryFn: async () => await getProfilesList(),
  })

export const profileRolesListQueryOptions = () =>
  queryOptions({
    queryKey: [ROLES_QUERY_KEY],
    queryFn: async () => await getRolesList(),
    staleTime: Number.POSITIVE_INFINITY,
  })
