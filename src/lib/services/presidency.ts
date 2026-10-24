// Common-area bookings and the money they carry.
//
//   * One house per area per day (amenity_reservations_one_per_day).
//   * A booking may carry a fee, paid in full; 0 is free. It keeps the
//     currency it was booked in, and its fee and refund are recorded in it.
//   * Paid while its fee (an income row in the amenity_fee category) is live:
//     derived, never stored. Deleting that income in the ledger puts the
//     booking back to unpaid.
//   * A paid booking keeps its area, house and amount, and isn't deleted but
//     cancelled (reservation.collect): it stays as history, its day is freed,
//     and an optional refund, up to what was paid, is an expense.
//   * A cancelled booking never changes again.
import { and, eq, isNull, sql } from 'drizzle-orm'
import type { Transaction } from '@/lib/db/client'
import { amenityReservations, transactions } from '@/lib/db/schema'
import type { Actor } from './actor'
import { ServiceError } from './errors'
import { hoaCurrency } from './settings'
import { dayLabel, periodCovering, requireReference, systemCategoryId } from './treasury'

type PaymentMethod = (typeof transactions.$inferSelect)['paymentMethod']

export interface ReservationFields {
  amenityId: string
  propertyId: string
  reservedOn: string
  amount: number
  notes: string | null
}

/** A booking, locked for the rest of the transaction, with what's been paid on it. */
async function lockReservation(tx: Transaction, id: string) {
  const [reservation] = await tx
    .select()
    .from(amenityReservations)
    .where(eq(amenityReservations.id, id))
    .for('update')
  if (!reservation) {
    throw new ServiceError('not_found', `reservation ${id}`)
  }

  const feeCategoryId = await systemCategoryId(tx, 'amenity_fee')
  const [paid] = await tx
    .select({
      count: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${transactions.amount}), 0)::float8`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.amenityReservationId, id),
        eq(transactions.categoryId, feeCategoryId),
        isNull(transactions.deletedAt),
      ),
    )

  const amenity = await tx.query.amenities.findFirst({
    columns: { name: true },
    where: { id: reservation.amenityId },
  })

  return {
    reservation,
    isPaid: paid.count > 0,
    paidTotal: paid.total,
    feeCategoryId,
    label: dayLabel(amenity?.name ?? '', reservation.reservedOn),
  }
}

export async function createReservation(
  tx: Transaction,
  actor: Actor,
  input: ReservationFields,
): Promise<{ id: string }> {
  const [created] = await tx
    .insert(amenityReservations)
    .values({ ...input, currency: await hoaCurrency(tx), createdBy: actor.id })
    .returning({ id: amenityReservations.id })
  return created
}

/** Edits a booking. Not once cancelled; once paid, only the day and the notes. */
export async function updateReservation(
  tx: Transaction,
  id: string,
  input: ReservationFields,
): Promise<void> {
  const { reservation, isPaid } = await lockReservation(tx, id)
  if (reservation.cancelledAt !== null) {
    throw new ServiceError('reservation_cancelled')
  }
  const keepsTerms =
    input.amenityId === reservation.amenityId &&
    input.propertyId === reservation.propertyId &&
    input.amount === reservation.amount
  if (isPaid && !keepsTerms) {
    throw new ServiceError('reservation_paid')
  }

  await tx.update(amenityReservations).set(input).where(eq(amenityReservations.id, id))
}

/** Deletes an unpaid booking; a paid one is cancelled instead (cancelReservation). */
export async function deleteReservation(tx: Transaction, id: string): Promise<void> {
  const { reservation, isPaid } = await lockReservation(tx, id)
  if (reservation.cancelledAt !== null) {
    throw new ServiceError('reservation_cancelled')
  }
  if (isPaid) {
    throw new ServiceError('reservation_paid')
  }

  await tx.delete(amenityReservations).where(eq(amenityReservations.id, id))
}

export interface ReservationPaymentInput {
  occurredOn: string
  folio: string | null
  paymentMethod: PaymentMethod
  reference: string | null
  notes: string | null
}

/** Records a booking's fee: an income row in its currency, in the period of the payment's day. */
export async function payReservation(
  tx: Transaction,
  actor: Actor,
  id: string,
  input: ReservationPaymentInput,
): Promise<{ transactionId: string }> {
  requireReference(input.paymentMethod, input.reference)

  const { reservation, isPaid, feeCategoryId, label } = await lockReservation(tx, id)
  if (reservation.cancelledAt !== null) {
    throw new ServiceError('reservation_cancelled')
  }
  if (reservation.amount === 0) {
    throw new ServiceError('reservation_free')
  }
  if (isPaid) {
    throw new ServiceError('already_resolved')
  }

  const period = await periodCovering(tx, input.occurredOn)
  const [created] = await tx
    .insert(transactions)
    .values({
      kind: 'income',
      categoryId: feeCategoryId,
      periodId: period.id,
      propertyId: reservation.propertyId,
      amenityReservationId: reservation.id,
      amount: reservation.amount,
      currency: reservation.currency,
      occurredOn: input.occurredOn,
      paymentMethod: input.paymentMethod,
      folio: input.folio,
      reference: input.reference,
      description: `Tarifa ${label}`,
      notes: input.notes,
      createdBy: actor.id,
    })
    .returning({ id: transactions.id })

  return { transactionId: created.id }
}

export interface CancellationInput {
  /** 0 for no refund. */
  refundAmount: number
  occurredOn: string
  paymentMethod: PaymentMethod
  reference: string | null
  notes: string | null
}

/**
 * Cancels a booking: frees its day and keeps it as history. A refund, up to
 * what was paid, is an expense of the payment's period; the fee stays where
 * it was, so a later refund doesn't rewrite a past report.
 */
export async function cancelReservation(
  tx: Transaction,
  actor: Actor,
  id: string,
  input: CancellationInput,
): Promise<void> {
  const { reservation, paidTotal, label } = await lockReservation(tx, id)
  if (reservation.cancelledAt !== null) {
    throw new ServiceError('reservation_cancelled')
  }
  if (input.refundAmount > paidTotal) {
    throw new ServiceError('refund_too_large')
  }

  if (input.refundAmount > 0) {
    requireReference(input.paymentMethod, input.reference)
    const period = await periodCovering(tx, input.occurredOn)
    await tx.insert(transactions).values({
      kind: 'expense',
      categoryId: await systemCategoryId(tx, 'amenity_refund'),
      periodId: period.id,
      propertyId: reservation.propertyId,
      amenityReservationId: reservation.id,
      amount: input.refundAmount,
      currency: reservation.currency,
      occurredOn: input.occurredOn,
      paymentMethod: input.paymentMethod,
      reference: input.reference,
      description: `Reembolso ${label}`,
      notes: input.notes,
      createdBy: actor.id,
    })
  }

  await tx
    .update(amenityReservations)
    .set({ cancelledAt: sql`now()`, cancelledBy: actor.id })
    .where(eq(amenityReservations.id, id))
}
