import { queryOptions } from '@tanstack/react-query'
import { getViolationsList } from '@/server-fns/violations'

export const VIOLATIONS_LIST_QUERY_KEY = 'violations-list'

export const violationsListQueryOptions = () =>
  queryOptions({
    queryKey: [VIOLATIONS_LIST_QUERY_KEY],
    queryFn: async () => await getViolationsList(),
  })
