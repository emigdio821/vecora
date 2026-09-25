import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const HOA_BOARD_QUERY_KEY = 'hoa-board'

/**
 * Board members = accounts holding at least one role (`!inner` drops the
 * role-less ones). The resident link is optional: an account created outside
 * the app (seeds, dashboard) may not be tied to the registry yet.
 */
function boardMembersQuery() {
  return createClient()
    .from('profiles')
    .select(
      `
      id, full_name,
      user_roles!user_id!inner ( role ),
      resident:residents!profile_id (
        id, first_name, last_name, email, phone,
        property_residents ( property:properties!inner ( id, number ) )
      )
      `,
    )
    .order('full_name')
}

export type BoardMemberQueryData = QueryData<ReturnType<typeof boardMembersQuery>>[number]

export function boardMembersQueryOptions() {
  return queryOptions({
    queryKey: [HOA_BOARD_QUERY_KEY, 'members'],
    queryFn: async () => {
      const { data, error } = await boardMembersQuery()
      if (error) throw error
      return data
    },
  })
}
