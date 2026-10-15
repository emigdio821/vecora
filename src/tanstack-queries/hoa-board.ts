import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const HOA_BOARD_QUERY_KEY = 'hoa-board'

/**
 * Board members = accounts holding at least one role (`!inner` drops the
 * role-less ones). The resident link is optional: an account created outside
 * the app (seeds, dashboard) may not be tied to the registry yet. The main
 * admin is the app's own account, not a board seat, so it isn't listed.
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
    .eq('is_main_admin', false)
    .order('full_name')
}

export type BoardMemberQueryData = QueryData<ReturnType<typeof boardMembersQuery>>[number]

export const boardMembersQueryOptions = queryOptions({
  queryKey: [HOA_BOARD_QUERY_KEY, 'members'],
  queryFn: async () => {
    const { data, error } = await boardMembersQuery()
    if (error) throw error
    return data
  },
})
