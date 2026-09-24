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
