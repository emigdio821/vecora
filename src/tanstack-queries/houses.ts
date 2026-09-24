import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const HOUSES_QUERY_KEY = 'houses'

// "House" in the app, `properties` in the database.
function housesListQuery() {
  return (
    createClient()
      .from('properties')
      .select(
        `
      id, number, notes, created_at, updated_at,
      property_residents ( relationship, resident:residents!inner ( id, first_name, last_name, phone, email ) )
      `,
      )
      .is('deleted_at', null)
      // Soft-deleted residents keep their links (so undo restores them); `!inner`
      // drops those links here without dropping the house.
      .is('property_residents.resident.deleted_at', null)
      .order('updated_at', { ascending: false })
  )
}

export type HouseQueryData = QueryData<ReturnType<typeof housesListQuery>>[number]

export function housesListQueryOptions() {
  return queryOptions({
    queryKey: [HOUSES_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await housesListQuery()
      if (error) throw error
      return data
    },
  })
}

/** Lightweight list for pickers: number + who lives there. */
function housesPickerQuery() {
  return createClient()
    .from('properties')
    .select(
      `
      id, number,
      property_residents ( relationship, resident:residents!inner ( id, first_name, last_name ) )
      `,
    )
    .is('deleted_at', null)
    .is('property_residents.resident.deleted_at', null)
}

export type PickerHouse = QueryData<ReturnType<typeof housesPickerQuery>>[number]

/** Shares the `houses` prefix so invalidating the list also refreshes pickers. */
export function housesPickerQueryOptions() {
  return queryOptions({
    queryKey: [HOUSES_QUERY_KEY, 'picker'],
    queryFn: async () => {
      const { data, error } = await housesPickerQuery()
      if (error) throw error
      // Numeric-aware so "2" sorts before "10" (Postgres would sort them as text).
      return data.sort((a, b) => a.number.localeCompare(b.number, 'es', { numeric: true }))
    },
  })
}
