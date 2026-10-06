import type { Badge } from '@/components/ui/badge'
import { formatDay } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import type { ReservationQueryData } from '@/tanstack-queries/presidency'

/** Derived, never stored: see supabase/migrations/20260921000300_amenities.sql. */
export type ReservationStatus = 'pending' | 'paid' | 'free' | 'cancelled'

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  get pending() {
    return m.presidency_reservation_status_pending()
  },
  get paid() {
    return m.presidency_reservation_status_paid()
  },
  get free() {
    return m.presidency_no_cost()
  },
  get cancelled() {
    return m.presidency_reservation_status_cancelled()
  },
}

/** Sort order for the status column: what's left to collect comes first. */
export const RESERVATION_STATUS_ORDER: Record<ReservationStatus, number> = {
  pending: 0,
  paid: 1,
  free: 2,
  cancelled: 3,
}

export const RESERVATION_STATUS_BADGE_VARIANT: Record<
  ReservationStatus,
  React.ComponentProps<typeof Badge>['variant']
> = {
  pending: 'warning',
  paid: 'success',
  free: 'secondary',
  cancelled: 'error',
}

/** The live fee row, if the treasurer collected it. */
export function reservationPayment(reservation: ReservationQueryData) {
  return reservation.movements.find((m) => m.kind === 'income')
}

/** The live refund row, if the booking was cancelled with one. */
export function reservationRefund(reservation: ReservationQueryData) {
  return reservation.movements.find((m) => m.kind === 'expense')
}

export function reservationStatus(reservation: ReservationQueryData): ReservationStatus {
  if (reservation.cancelled_at) return 'cancelled'
  if (reservationPayment(reservation)) return 'paid'
  if (Number(reservation.amount) === 0) return 'free'
  return 'pending'
}

/** Area, day and house: how menus, drawers and toasts name a booking. */
export function reservationSummary(reservation: ReservationQueryData) {
  return `${reservation.amenity.name} - ${formatDay(reservation.reserved_on)} - ${m.common_house_label({ number: reservation.property.number })}`
}
