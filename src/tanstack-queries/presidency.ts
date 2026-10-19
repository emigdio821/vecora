import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const PRESIDENCY_QUERY_KEY = 'presidency'

/**
 * Newest first. `transactions(count)` includes soft-deleted rows on purpose:
 * the ledger is never purged, so any row at all blocks a hard delete.
 * Treasury reads them too (summaries, fees, the record drawers), and every
 * movement saved changes a count, so its mutations invalidate this as well.
 */
function periodsQuery() {
  return createClient()
    .from('periods')
    .select('id, name, starts_on, ends_on, monthly_fee, late_fee, due_day, currency, transactions(count)')
    .order('starts_on', { ascending: false })
}

export type PeriodQueryData = QueryData<ReturnType<typeof periodsQuery>>[number]

export const periodsQueryOptions = queryOptions({
  queryKey: [PRESIDENCY_QUERY_KEY, 'periods'],
  queryFn: async () => {
    const { data, error } = await periodsQuery()
    if (error) throw error
    return data
  },
})

/**
 * Every common area, by name, retired ones included: their bookings still
 * name them. `amenity_reservations(count)` decides whether one can be deleted.
 */
function amenitiesQuery() {
  return createClient()
    .from('amenities')
    .select('id, name, default_fee, is_active, amenity_reservations(count)')
    .order('name')
}

export type AmenityQueryData = QueryData<ReturnType<typeof amenitiesQuery>>[number]

/** Reads the `amenity_reservations(count)` embed of an amenity row. */
export function reservationCount(amenity: AmenityQueryData) {
  return amenity.amenity_reservations[0]?.count ?? 0
}

export const amenitiesQueryOptions = queryOptions({
  queryKey: [PRESIDENCY_QUERY_KEY, 'amenities'],
  queryFn: async () => {
    const { data, error } = await amenitiesQuery()
    if (error) throw error
    return data
  },
})

/**
 * Every booking, upcoming first. Soft-deleted houses stay attached: the booking did happen.
 * `movements` are its live fee (income) and refund (expense) in the ledger;
 * the payment status is derived from them (see reservationStatus).
 */
function reservationsQuery() {
  return createClient()
    .from('amenity_reservations')
    .select(
      `id, reserved_on, amount, currency, notes, created_at, cancelled_at,
       amenity:amenities!inner ( id, name ),
       property:properties!inner ( id, number ),
       movements:transactions ( id, kind, amount, occurred_on, folio )`,
    )
    .is('movements.deleted_at', null)
    .order('reserved_on', { ascending: false })
}

export type ReservationQueryData = QueryData<ReturnType<typeof reservationsQuery>>[number]

export const reservationsQueryOptions = queryOptions({
  queryKey: [PRESIDENCY_QUERY_KEY, 'reservations'],
  queryFn: async () => {
    const { data, error } = await reservationsQuery()
    if (error) throw error
    return data
  },
})
