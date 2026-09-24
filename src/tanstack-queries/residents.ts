import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const RESIDENTS_QUERY_KEY = 'residents'

function residentsListQuery() {
  return createClient()
    .from('residents')
    .select(
      `
      id, first_name, last_name, phone, email, notes, created_at, updated_at,
      profile:profiles!profile_id ( id, full_name, user_roles!user_id ( role ) ),
      property_residents ( relationship, property:properties ( id, number ) )
      `,
    )
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
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
