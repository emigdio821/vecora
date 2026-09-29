import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const PRESIDENCY_QUERY_KEY = 'presidency'

/**
 * Every booking, upcoming first. Soft-deleted houses stay attached: the booking did happen.
 * `movements` are its live rent (income) and refund (expense) in the ledger;
 * the payment status is derived from them (see hallReservationStatus).
 */
function hallReservationsQuery() {
  return createClient()
    .from('hall_reservations')
    .select(
      `id, reserved_on, amount, notes, created_at, cancelled_at,
       property:properties!inner ( id, number ),
       movements:transactions ( id, kind, amount, occurred_on, folio )`,
    )
    .is('movements.deleted_at', null)
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
