import { createServerFn } from '@tanstack/react-start'
import { eq, sql } from 'drizzle-orm'
import { type ActionResult, databaseError, errorMessage, FK_VIOLATION } from '@/lib/action-result'
import { boardMiddleware, requirePermission } from '@/lib/auth/middleware'
import { db, transactionAs } from '@/lib/db'
import { amenities } from '@/lib/db/schema'
import type { ServiceErrorCode } from '@/lib/services/errors'
import * as presidency from '@/lib/services/presidency'
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

const amenityWrite = requirePermission({ amenity: ['write'] })
const reservationWrite = requirePermission({ reservation: ['write'] })
const reservationCollect = requirePermission({ reservation: ['collect'] })

// ---------------------------------------------------------------------------
// periods
// ---------------------------------------------------------------------------

/**
 * Newest first. `transactionCount` includes soft-deleted rows on purpose:
 * the ledger is never purged, so any row at all blocks a hard delete.
 */
const fetchPeriodsFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(() =>
    db.query.periods.findMany({
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
          sql<number>`(select count(*)::int from transactions t where t.period_id = ${table.id})`,
      },
      orderBy: { startsOn: 'desc' },
    }),
  )

export const fetchPeriods = () => fetchPeriodsFn()

// ---------------------------------------------------------------------------
// amenities
// ---------------------------------------------------------------------------

/**
 * Every common area, by name, retired ones included: their bookings still
 * name them. `reservationCount` decides whether one can be deleted.
 */
const fetchAmenitiesFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(() =>
    db.query.amenities.findMany({
      columns: { id: true, name: true, defaultFee: true, isActive: true },
      extras: {
        reservationCount: (table) =>
          sql<number>`(select count(*)::int from amenity_reservations r where r.amenity_id = ${table.id})`,
      },
      orderBy: { name: 'asc' },
    }),
  )

export const fetchAmenities = () => fetchAmenitiesFn()

function toAmenityMessage(error: unknown, fallback: string) {
  return errorMessage(error, {
    fallback,
    constraints: { amenities_name_unique: m.presidency_error_amenity_name_taken() },
  })
}

const createAmenityFn = createServerFn({ method: 'POST' })
  .middleware([amenityWrite])
  .validator((input: AmenityInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = amenitySchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    try {
      const [created] = await transactionAs(context.user.id, (tx) =>
        tx.insert(amenities).values(parsed.data).returning({ id: amenities.id }),
      )
      return { data: created }
    } catch (error) {
      return { error: toAmenityMessage(error, m.presidency_error_create_amenity()) }
    }
  })

export const createAmenity = (input: AmenityInput) => createAmenityFn({ data: input })

/** Past bookings keep their amount; the new fee applies from the next one. */
const updateAmenityFn = createServerFn({ method: 'POST' })
  .middleware([amenityWrite])
  .validator((data: { id: string; input: AmenityInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult> => {
    const parsed = amenitySchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    try {
      await transactionAs(context.user.id, (tx) =>
        tx.update(amenities).set(parsed.data).where(eq(amenities.id, id)),
      )
    } catch (error) {
      return { error: toAmenityMessage(error, m.presidency_error_update_amenity()) }
    }

    return { data: undefined }
  })

export const updateAmenity = (id: string, input: AmenityInput) => updateAmenityFn({ data: { id, input } })

/** Retire / reinstate. Retired areas keep their bookings but leave the booking form. */
const setAmenityActiveFn = createServerFn({ method: 'POST' })
  .middleware([amenityWrite])
  .validator((data: { id: string; isActive: boolean }) => data)
  .handler(async ({ data: { id, isActive }, context }): Promise<ActionResult> => {
    try {
      await transactionAs(context.user.id, (tx) =>
        tx.update(amenities).set({ isActive }).where(eq(amenities.id, id)),
      )
    } catch (error) {
      return { error: toAmenityMessage(error, m.presidency_error_update_amenity()) }
    }

    return { data: undefined }
  })

export const setAmenityActive = (id: string, isActive: boolean) =>
  setAmenityActiveFn({ data: { id, isActive } })

/** Hard delete; only possible while the area has no bookings. */
const deleteAmenityFn = createServerFn({ method: 'POST' })
  .middleware([amenityWrite])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }): Promise<ActionResult> => {
    try {
      await transactionAs(context.user.id, (tx) => tx.delete(amenities).where(eq(amenities.id, id)))
    } catch (error) {
      if (databaseError(error).code === FK_VIOLATION) {
        return { error: m.presidency_error_amenity_in_use() }
      }
      return { error: toAmenityMessage(error, m.presidency_error_delete_amenity()) }
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
  .middleware([boardMiddleware])
  .handler(async () => {
    const reservations = await db.query.amenityReservations.findMany({
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
    })

    return reservations.map(({ transactions, ...reservation }) => ({
      ...reservation,
      movements: transactions,
    }))
  })

export const fetchReservations = () => fetchReservationsFn()

/** What the booking rules say, wherever they come up; `service` overrides them. */
function toMessage(error: unknown, fallback: string, service?: Partial<Record<ServiceErrorCode, string>>) {
  return errorMessage(error, {
    fallback,
    service: {
      not_found: m.presidency_error_reservation_not_found(),
      reservation_cancelled: m.presidency_error_already_cancelled(),
      reservation_free: m.presidency_error_no_cost(),
      already_resolved: m.presidency_error_already_paid(),
      refund_too_large: m.presidency_error_refund_exceeds(),
      transfer_needs_reference: m.presidency_reference_required(),
      ...service,
    },
    constraints: { amenity_reservations_one_per_day: m.presidency_error_day_taken() },
  })
}

const createReservationFn = createServerFn({ method: 'POST' })
  .middleware([reservationWrite])
  .validator((input: ReservationInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = reservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { amenityId, propertyId, reservedOn, amount, notes } = parsed.data

    try {
      const created = await transactionAs(context.user.id, (tx) =>
        presidency.createReservation(tx, context.user, {
          amenityId,
          propertyId,
          reservedOn,
          amount,
          notes: notes || null,
        }),
      )
      return { data: created }
    } catch (error) {
      return { error: toMessage(error, m.presidency_error_create_reservation()) }
    }
  })

export const createReservation = (input: ReservationInput) => createReservationFn({ data: input })

/** Not once cancelled. Once paid, the area, house and amount stay. */
const updateReservationFn = createServerFn({ method: 'POST' })
  .middleware([reservationWrite])
  .validator((data: { id: string; input: ReservationInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult> => {
    const parsed = reservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { amenityId, propertyId, reservedOn, amount, notes } = parsed.data

    try {
      await transactionAs(context.user.id, (tx) =>
        presidency.updateReservation(tx, id, {
          amenityId,
          propertyId,
          reservedOn,
          amount,
          notes: notes || null,
        }),
      )
    } catch (error) {
      return {
        error: toMessage(error, m.presidency_error_update_reservation(), {
          reservation_paid: m.presidency_error_reservation_paid_locked(),
        }),
      }
    }

    return { data: undefined }
  })

export const updateReservation = (id: string, input: ReservationInput) =>
  updateReservationFn({ data: { id, input } })

/** Unpaid bookings only; a paid one is cancelled with cancelReservation. */
const deleteReservationFn = createServerFn({ method: 'POST' })
  .middleware([reservationWrite])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }): Promise<ActionResult> => {
    try {
      await transactionAs(context.user.id, (tx) => presidency.deleteReservation(tx, id))
    } catch (error) {
      return {
        error: toMessage(error, m.presidency_error_cancel_reservation(), {
          reservation_paid: m.presidency_error_reservation_paid_cancel(),
        }),
      }
    }

    return { data: undefined }
  })

export const deleteReservation = (id: string) => deleteReservationFn({ data: id })

const payReservationFn = createServerFn({ method: 'POST' })
  .middleware([reservationCollect])
  .validator((data: { id: string; input: PayReservationInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult<{ transactionId: string }>> => {
    const parsed = payReservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { occurredOn, folio, paymentMethod, reference, notes } = parsed.data

    try {
      const paid = await transactionAs(context.user.id, (tx) =>
        presidency.payReservation(tx, context.user, id, {
          occurredOn,
          folio,
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
        }),
      )
      return { data: paid }
    } catch (error) {
      return { error: toMessage(error, m.presidency_error_record_payment()) }
    }
  })

export const payReservation = (id: string, input: PayReservationInput) =>
  payReservationFn({ data: { id, input } })

const cancelReservationFn = createServerFn({ method: 'POST' })
  .middleware([reservationCollect])
  .validator((data: { id: string; input: CancelReservationInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult> => {
    const parsed = cancelReservationSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { refundAmount, occurredOn, paymentMethod, reference, notes } = parsed.data

    try {
      await transactionAs(context.user.id, (tx) =>
        presidency.cancelReservation(tx, context.user, id, {
          refundAmount,
          occurredOn,
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
        }),
      )
    } catch (error) {
      return { error: toMessage(error, m.presidency_error_cancel_reservation()) }
    }

    return { data: undefined }
  })

export const cancelReservation = (id: string, input: CancelReservationInput) =>
  cancelReservationFn({ data: { id, input } })
