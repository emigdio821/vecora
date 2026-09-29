import type { Badge } from '@/components/ui/badge'
import type { HallReservationQueryData } from '@/tanstack-queries/presidency'

/** Derived, never stored: see supabase/migrations/20260929000000_hall_payments.sql. */
export type HallReservationStatus = 'pending' | 'paid' | 'free' | 'cancelled'

export const HALL_STATUS_LABEL: Record<HallReservationStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  free: 'Sin costo',
  cancelled: 'Cancelada',
}

/** Sort order for the "Estado" column: what's left to collect comes first. */
export const HALL_STATUS_ORDER: Record<HallReservationStatus, number> = {
  pending: 0,
  paid: 1,
  free: 2,
  cancelled: 3,
}

export const HALL_STATUS_BADGE_VARIANT: Record<
  HallReservationStatus,
  React.ComponentProps<typeof Badge>['variant']
> = {
  pending: 'warning',
  paid: 'success',
  free: 'secondary',
  cancelled: 'error',
}

/** The live fee row, if the treasurer collected it. */
export function hallPayment(reservation: HallReservationQueryData) {
  return reservation.movements.find((m) => m.kind === 'income')
}

/** The live refund row, if the booking was cancelled with one. */
export function hallRefund(reservation: HallReservationQueryData) {
  return reservation.movements.find((m) => m.kind === 'expense')
}

export function hallReservationStatus(reservation: HallReservationQueryData): HallReservationStatus {
  if (reservation.cancelled_at) return 'cancelled'
  if (hallPayment(reservation)) return 'paid'
  if (Number(reservation.amount) === 0) return 'free'
  return 'pending'
}
