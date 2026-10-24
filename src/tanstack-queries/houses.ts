import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
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

/**
 * The same picker from Supabase, for the sections still there (Treasury, Presidency and
 * the dashboard's fee card): house ids differ between the two databases, and those
 * sections save theirs to Supabase. Goes away once they move to Neon.
 */
export const supabaseHousesPickerQueryOptions = queryOptions({
  queryKey: [HOUSES_QUERY_KEY, 'supabase-picker'],
  queryFn: async (): Promise<PickerHouse[]> => {
    const { data, error } = await createClient()
      .from('properties')
      .select(
        `
        id, number,
        owners:property_residents ( resident:residents!inner ( id, first_name, last_name ) )
        `,
      )
      .is('deleted_at', null)
      .eq('owners.relationship', 'owner')
      .is('owners.resident.deleted_at', null)
    if (error) throw error
    // Numeric-aware so "2" sorts before "10" (Postgres would sort them as text).
    return data.sort((a, b) => a.number.localeCompare(b.number, 'es', { numeric: true }))
  },
})
