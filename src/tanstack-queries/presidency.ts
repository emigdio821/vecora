import { queryOptions } from '@tanstack/react-query'
import { fetchAmenities, fetchPeriods, fetchReservations } from '@/server-actions/presidency'

export const PRESIDENCY_QUERY_KEY = 'presidency'

/**
 * Treasury reads the periods too (summaries, fees, the record drawers), and every
 * movement saved changes a `transactionCount`, so its mutations invalidate this as well.
 */
export type PeriodQueryData = Awaited<ReturnType<typeof fetchPeriods>>[number]

export const periodsQueryOptions = queryOptions({
  queryKey: [PRESIDENCY_QUERY_KEY, 'periods'],
  queryFn: () => fetchPeriods(),
})

export type AmenityQueryData = Awaited<ReturnType<typeof fetchAmenities>>[number]

/** How many bookings an amenity has; it can be deleted only at 0. */
export function reservationCount(amenity: AmenityQueryData) {
  return amenity.reservationCount
}

export const amenitiesQueryOptions = queryOptions({
  queryKey: [PRESIDENCY_QUERY_KEY, 'amenities'],
  queryFn: () => fetchAmenities(),
})

export type ReservationQueryData = Awaited<ReturnType<typeof fetchReservations>>[number]

export const reservationsQueryOptions = queryOptions({
  queryKey: [PRESIDENCY_QUERY_KEY, 'reservations'],
  queryFn: () => fetchReservations(),
})
