import { queryOptions } from '@tanstack/react-query'
import { getOwners } from '@/api/server-functions/owners'

export const OWNERS_QUERY_KEY = 'owners'

export const ownersListQueryOptions = () =>
  queryOptions({
    queryKey: [OWNERS_QUERY_KEY],
    queryFn: async () => await getOwners(),
    staleTime: Number.POSITIVE_INFINITY,
  })
