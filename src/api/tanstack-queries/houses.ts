import { queryOptions } from '@tanstack/react-query'
import { getAvailableHouses, getHouses } from '@/api/server-functions/houses'

export const HOUSES_LIST_QUERY_KEY = 'houses'
export const AVAILABLE_HOUSES_QUERY_KEY = 'available-houses'

export const housesListQueryOptions = () =>
  queryOptions({
    queryKey: [HOUSES_LIST_QUERY_KEY],
    queryFn: async () => await getHouses(),
  })

export const availableHousesQueryOptions = () =>
  queryOptions({
    queryKey: [AVAILABLE_HOUSES_QUERY_KEY],
    queryFn: async () => await getAvailableHouses(),
  })
