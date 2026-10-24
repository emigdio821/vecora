import { queryOptions } from '@tanstack/react-query'
import { fetchResidents, fetchResidentsPicker } from '@/server-actions/residents'

export const RESIDENTS_QUERY_KEY = 'residents'

export type ResidentQueryData = Awaited<ReturnType<typeof fetchResidents>>[number]

export const residentsListQueryOptions = queryOptions({
  queryKey: [RESIDENTS_QUERY_KEY],
  queryFn: () => fetchResidents(),
})

export type PickerResident = Awaited<ReturnType<typeof fetchResidentsPicker>>[number]

/** Shares the `residents` prefix so invalidating the list also refreshes pickers. */
export const residentsPickerQueryOptions = queryOptions({
  queryKey: [RESIDENTS_QUERY_KEY, 'picker'],
  queryFn: () => fetchResidentsPicker(),
})
