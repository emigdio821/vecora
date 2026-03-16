import { queryOptions } from '@tanstack/react-query'
import { getAvailableHouses, getHouses } from '@/api/server-functions/houses'
import type { SelectHouse } from '@/db/schema/zod/houses'
import type { SelectResident } from '@/db/schema/zod/residents'

export const HOUSES_QUERY_KEY = 'houses'
export const AVAILABLE_HOUSES_QUERY_KEY = 'available-houses'

export type HouseQueryData = SelectHouse & {
  resident: SelectResident | null
}

export const housesListQueryOptions = () =>
  queryOptions({
    queryKey: [HOUSES_QUERY_KEY],
    queryFn: async (): Promise<HouseQueryData[]> => await getHouses(),
  })

export const availableHousesQueryOptions = () =>
  queryOptions({
    queryKey: [AVAILABLE_HOUSES_QUERY_KEY],
    queryFn: async (): Promise<SelectHouse[]> => await getAvailableHouses(),
  })
