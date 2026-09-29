import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const RESIDENTS_QUERY_KEY = 'residents'

function residentsListQuery() {
  return (
    createClient()
      .from('residents')
      .select(
        `
      id, first_name, last_name, phone, email, notes, created_at, updated_at,
      profile:profiles!profile_id ( id, full_name, user_roles!user_id ( role ) ),
      property_residents ( relationship, property:properties!inner ( id, number ) )
      `,
      )
      .is('deleted_at', null)
      // Soft-deleted houses keep their links (so undo restores them); `!inner`
      // drops those links here without dropping the resident.
      .is('property_residents.property.deleted_at', null)
      .order('updated_at', { ascending: false })
  )
}

export type ResidentQueryData = QueryData<ReturnType<typeof residentsListQuery>>[number]

export function residentsListQueryOptions() {
  return queryOptions({
    queryKey: [RESIDENTS_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await residentsListQuery()
      if (error) throw error
      return data
    },
  })
}

/**
 * Lightweight list for pickers: identity + which houses each resident is
 * linked to. `email` is there for the board picker (an account needs one).
 */
function residentsPickerQuery() {
  return createClient()
    .from('residents')
    .select(
      `
      id, first_name, last_name, email,
      property_residents ( property:properties!inner ( id, number ) )
      `,
    )
    .is('deleted_at', null)
    .is('property_residents.property.deleted_at', null)
    .order('first_name')
    .order('last_name')
}

export type PickerResident = QueryData<ReturnType<typeof residentsPickerQuery>>[number]

/** Shares the `residents` prefix so invalidating the list also refreshes pickers. */
export function residentsPickerQueryOptions() {
  return queryOptions({
    queryKey: [RESIDENTS_QUERY_KEY, 'picker'],
    queryFn: async () => {
      const { data, error } = await residentsPickerQuery()
      if (error) throw error
      return data
    },
  })
}
