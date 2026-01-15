import { queryOptions } from '@tanstack/react-query'
import { getAvailableHouses } from '@/server-fns/houses'

export const AVAILABLE_HOUSES_QUERY_KEY = 'available-houses'

export const availableHousesQueryOptions = () =>
  queryOptions({
    queryKey: [AVAILABLE_HOUSES_QUERY_KEY],
    queryFn: async () => await getAvailableHouses(),
  })
