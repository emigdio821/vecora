import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const PRESIDENCY_QUERY_KEY = 'presidency'

/** Every booking, upcoming first. Soft-deleted houses stay attached: the booking did happen. */
function hallReservationsQuery() {
  return createClient()
    .from('hall_reservations')
    .select('id, reserved_on, notes, created_at, property:properties!inner ( id, number )')
    .order('reserved_on', { ascending: false })
}

export type HallReservationQueryData = QueryData<ReturnType<typeof hallReservationsQuery>>[number]

export function hallReservationsQueryOptions() {
  return queryOptions({
    queryKey: [PRESIDENCY_QUERY_KEY, 'hall-reservations'],
    queryFn: async () => {
      const { data, error } = await hallReservationsQuery()
      if (error) throw error
      return data
    },
  })
}
