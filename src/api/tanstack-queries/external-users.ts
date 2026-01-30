import { queryOptions } from '@tanstack/react-query'
import { getExternalUsers } from '@/api/server-functions/external-users'

export const EXTERNAL_USERS_QUERY_KEY = 'external-users'

export const externalUsersListQueryOptions = () =>
  queryOptions({
    queryKey: [EXTERNAL_USERS_QUERY_KEY],
    queryFn: async () => await getExternalUsers(),
    staleTime: Number.POSITIVE_INFINITY,
  })
