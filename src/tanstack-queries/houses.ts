import { queryOptions } from '@tanstack/react-query'
import { fetchHouses, fetchHousesPicker } from '@/server-actions/houses'

export const HOUSES_QUERY_KEY = 'houses'

// "House" in the app, `properties` in the database.

export type HouseQueryData = Awaited<ReturnType<typeof fetchHouses>>[number]

export const housesListQueryOptions = queryOptions({
  queryKey: [HOUSES_QUERY_KEY],
  queryFn: () => fetchHouses(),
})

export type PickerHouse = Awaited<ReturnType<typeof fetchHousesPicker>>[number]

/** Shares the `houses` prefix so invalidating the list also refreshes pickers. */
export const housesPickerQueryOptions = queryOptions({
  queryKey: [HOUSES_QUERY_KEY, 'picker'],
  queryFn: () => fetchHousesPicker(),
})
