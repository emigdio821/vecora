import { createServerFn } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import {
  type ActionResult,
  type DatabaseError,
  databaseError,
  FK_VIOLATION,
  isFolioTaken,
  postgrestErrorMessage,
  requestResolutionErrorMessage,
} from '@/lib/action-result'
import { withCurrentUser } from '@/lib/db/current-user'
import { amenities, amenityReservations } from '@/lib/db/schema'
import { authMiddleware } from '@/lib/supabase/auth-middleware'
import {
  type AmenityInput,
  amenitySchema,
  type CancelReservationInput,
  cancelReservationSchema,
  type PayReservationInput,
  payReservationSchema,
  type ReservationInput,
  reservationSchema,
} from '@/lib/validations/presidency'
import { m } from '@/paraglide/messages'

// ---------------------------------------------------------------------------
// periods
// ---------------------------------------------------------------------------

/**
 * Newest first. `transaction_count` includes soft-deleted rows on purpose:
 * the ledger is never purged, so any row at all blocks a hard delete.
 * The rows keep the database's column names, the shape the screens were built on.
 */
const fetchPeriodsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const periods = await withCurrentUser((tx) =>
      tx.query.periods.findMany({
        columns: {
          id: true,
          name: true,
          startsOn: true,
          endsOn: true,
          monthlyFee: true,
          lateFee: true,
          dueDay: true,
          currency: true,
        },
        extras: {
          transactionCount: (table) =>
            sql<number>`(select count(*)::int from public.transactions t where t.period_id = ${table.id})`,
        },
        orderBy: { startsOn: 'desc' },
      }),
    )

    return periods.map((period) => ({
      id: period.id,
      name: period.name,
      starts_on: period.startsOn,
      ends_on: period.endsOn,
      monthly_fee: period.monthlyFee,
      late_fee: period.lateFee,
      due_day: period.dueDay,
      currency: period.currency,
      transaction_count: period.transactionCount,
    }))
  })

export const fetchPeriods = () => fetchPeriodsFn()

// ---------------------------------------------------------------------------
// amenities
// ---------------------------------------------------------------------------

/**
 * Every common area, by name, retired ones included: their bookings still
 * name them. `reservation_count` decides whether one can be deleted.
 */
const fetchAmenitiesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const rows = await withCurrentUser((tx) =>
      tx.query.amenities.findMany({
        columns: { id: true, name: true, defaultFee: true, isActive: true },
        extras: {
          reservationCount: (table) =>
            sql<number>`(select count(*)::int from public.amenity_reservations r where r.amenity_id = ${table.id})`,
        },
        orderBy: { name: 'asc' },
      }),
    )

    return rows.map((amenity) => ({
      id: amenity.id,
      name: amenity.name,
      default_fee: amenity.defaultFee,
      is_active: amenity.isActive,
      reservation_count: amenity.reservationCount,
    }))
  })

export const fetchAmenities = () => fetchAmenitiesFn()

function toAmenityMessage(error: unknown, fallback: string) {
  return postgrestErrorMessage(databaseError(error), {
    fallback,
    unique: { amenities_name_unique: m.presidency_error_amenity_name_taken() },
  })
}

const createAmenityFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: AmenityInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = amenitySchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { name, default_fee } = parsed.data

    let created: Array<{ id: string }>
    try {
      created = await withCurrentUser((tx) =>
        tx.insert(amenities).values({ name, defaultFee: default_fee }).returning({ id: amenities.id }),
      )
    } catch (error) {
      return { error: toAmenityMessage(error, m.presidency_error_create_amenity()) }
    }

    return { data: created[0] }
  })

export const createAmenity = (input: AmenityInput) => createAmenityFn({ data: input })

/** Past bookings keep their amount; the new fee applies from the next one. */
const updateAmenityFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: AmenityInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = amenitySchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { name, default_fee } = parsed.data

    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(amenities)
          .set({ name, defaultFee: default_fee })
          .where(eq(amenities.id, id))
          .returning({ id: amenities.id }),
      )
    } catch (error) {
      return { error: toAmenityMessage(error, m.presidency_error_update_amenity()) }
    }
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const updateAmenity = (id: string, input: AmenityInput) => updateAmenityFn({ data: { id, input } })

/** Retire / reinstate. Retired areas keep their bookings but leave the booking form. */
const setAmenityActiveFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; isActive: boolean }) => data)
  .handler(async ({ data: { id, isActive } }): Promise<ActionResult> => {
    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx.update(amenities).set({ isActive }).where(eq(amenities.id, id)).returning({ id: amenities.id }),
      )
    } catch (error) {
      return { error: toAmenityMessage(error, m.presidency_error_update_amenity()) }
    }
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const setAmenityActive = (id: string, isActive: boolean) =>
  setAmenityActiveFn({ data: { id, isActive } })

/** Hard delete; only possible while the area has no bookings. */
const deleteAmenityFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    let deleted: Array<{ id: string }>
    try {
      deleted = await withCurrentUser((tx) =>
        tx.delete(amenities).where(eq(amenities.id, id)).returning({ id: amenities.id }),
      )
    } catch (error) {
      if (databaseError(error).code === FK_VIOLATION) {
        return { error: m.presidency_error_amenity_in_use() }
      }
      return { error: toAmenityMessage(error, m.presidency_error_delete_amenity()) }
    }
    if (deleted.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const deleteAmenity = (id: string) => deleteAmenityFn({ data: id })

// ---------------------------------------------------------------------------
// reservations
// ---------------------------------------------------------------------------

/**
 * Every booking, upcoming first. Soft-deleted houses stay attached: the booking did happen.
 * `movements` are its live fee (income) and refund (expense) in the ledger;
 * the payment status is derived from them (see reservationStatus).
 */
const fetchReservationsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const reservations = await withCurrentUser((tx) =>
      tx.query.amenityReservations.findMany({
        columns: {
          id: true,
          reservedOn: true,
          amount: true,
          currency: true,
          notes: true,
          createdAt: true,
          cancelledAt: true,
        },
        with: {
          amenity: { columns: { id: true, name: true } },
          property: { columns: { id: true, number: true } },
          transactions: {
            columns: { id: true, kind: true, amount: true, occurredOn: true, folio: true },
            where: { deletedAt: { isNull: true } },
          },
        },
        orderBy: { reservedOn: 'desc' },
      }),
    )

    return reservations.flatMap((reservation) => {
      const { amenity, property } = reservation
      // Both are required columns, so always there; Drizzle types the joins as optional anyway.
      if (!amenity || !property) {
        return []
      }
      return [
        {
          id: reservation.id,
          reserved_on: reservation.reservedOn,
          amount: reservation.amount,
          currency: reservation.currency,
          notes: reservation.notes,
          created_at: reservation.createdAt.toISOString(),
          cancelled_at: reservation.cancelledAt ? reservation.cancelledAt.toISOString() : null,
          amenity: { id: amenity.id, name: amenity.name },
          property: { id: property.id, number: property.number },
          movements: reservation.transactions.map((movement) => ({
            id: movement.id,
            kind: movement.kind,
            amount: movement.amount,
            occurred_on: movement.occurredOn,
            folio: movement.folio,
          })),
        },
      ]
    })
  })

export const fetchReservations = () => fetchReservationsFn()

// Raised by the guard trigger once a booking has money recorded against it.
const PAID = 'P0003'

function toMessage(error: unknown, fallback: string) {
  const cause = databaseError(error)
  if (cause.code === PAID && cause.message.includes('cancel it instead')) {
    return m.presidency_error_reservation_paid_cancel()
  }
  if (cause.code === PAID) {
    return m.presidency_error_reservation_paid_locked()
  }
  return postgrestErrorMessage(cause, {
    fallback,
    unique: { amenity_reservations_one_per_day: m.presidency_error_day_taken() },
  })
}

/** Errors from pay_amenity_reservation / cancel_amenity_reservation. */
function toResolutionMessage(error: DatabaseError, fallback: string) {
  if (isFolioTaken(error)) return m.common_folio_taken()
  if (error.message.includes('already paid')) return m.presidency_error_already_paid()
  if (error.message.includes('cancelled')) return m.presidency_error_already_cancelled()
  if (error.message.includes('no cost')) return m.presidency_error_no_cost()
  if (error.message.includes('exceeds')) return m.presidency_error_refund_exceeds()
  if (error.message.includes('not found')) return m.presidency_error_reservation_not_found()
  return requestResolutionErrorMessage(error, fallback)
}

const createReservationFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: ReservationInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = reservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { amenity_id, property_id, reserved_on, amount, notes } = parsed.data

    let created: Array<{ id: string }>
    try {
      created = await withCurrentUser((tx) =>
        tx
          .insert(amenityReservations)
          .values({
            amenityId: amenity_id,
            propertyId: property_id,
            reservedOn: reserved_on,
            amount,
            notes: notes || null,
          })
          .returning({ id: amenityReservations.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.presidency_error_create_reservation()) }
    }

    return { data: created[0] }
  })

export const createReservation = (input: ReservationInput) => createReservationFn({ data: input })

/** Not once cancelled (RLS). Once paid, the guard trigger keeps the area, house and amount. */
const updateReservationFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: ReservationInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = reservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { amenity_id, property_id, reserved_on, amount, notes } = parsed.data

    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(amenityReservations)
          .set({
            amenityId: amenity_id,
            propertyId: property_id,
            reservedOn: reserved_on,
            amount,
            notes: notes || null,
          })
          .where(eq(amenityReservations.id, id))
          .returning({ id: amenityReservations.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.presidency_error_update_reservation()) }
    }
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const updateReservation = (id: string, input: ReservationInput) =>
  updateReservationFn({ data: { id, input } })

/** Unpaid bookings only; a paid one is cancelled with cancelReservation. */
const deleteReservationFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    let deleted: Array<{ id: string }>
    try {
      deleted = await withCurrentUser((tx) =>
        tx
          .delete(amenityReservations)
          .where(eq(amenityReservations.id, id))
          .returning({ id: amenityReservations.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.presidency_error_cancel_reservation()) }
    }
    if (deleted.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const deleteReservation = (id: string) => deleteReservationFn({ data: id })

const payReservationFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: PayReservationInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ transaction_id: string }>> => {
    const parsed = payReservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { occurred_on, folio, payment_method, reference, notes } = parsed.data

    let transactionId: string
    try {
      const result = await withCurrentUser((tx) =>
        tx.execute<{ transaction_id: string }>(sql`
          select public.pay_amenity_reservation(
            p_reservation_id => ${id},
            p_occurred_on => ${occurred_on},
            p_folio => ${folio},
            p_payment_method => ${payment_method},
            p_reference => ${reference || null},
            p_notes => ${notes || null}
          ) as transaction_id
        `),
      )
      transactionId = result.rows[0].transaction_id
    } catch (error) {
      return { error: toResolutionMessage(databaseError(error), m.presidency_error_record_payment()) }
    }

    return { data: { transaction_id: transactionId } }
  })

export const payReservation = (id: string, input: PayReservationInput) =>
  payReservationFn({ data: { id, input } })

const cancelReservationFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: CancelReservationInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = cancelReservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { refund_amount, occurred_on, payment_method, reference, notes } = parsed.data

    try {
      await withCurrentUser((tx) =>
        tx.execute(sql`
          select public.cancel_amenity_reservation(
            p_reservation_id => ${id},
            p_refund_amount => ${refund_amount},
            p_occurred_on => ${occurred_on},
            p_payment_method => ${payment_method},
            p_reference => ${reference || null},
            p_notes => ${notes || null}
          )
        `),
      )
    } catch (error) {
      return { error: toResolutionMessage(databaseError(error), m.presidency_error_cancel_reservation()) }
    }

    return { data: undefined }
  })

export const cancelReservation = (id: string, input: CancelReservationInput) =>
  cancelReservationFn({ data: { id, input } })
