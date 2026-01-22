import { queryOptions } from '@tanstack/react-query'
import { getViolationsList } from '@/api/server-functions/violations'

export const VIOLATIONS_QUERY_KEY = 'violations'

export const violationsListQueryOptions = () =>
  queryOptions({
    queryKey: [VIOLATIONS_QUERY_KEY],
    queryFn: async () => await getViolationsList(),
  })
