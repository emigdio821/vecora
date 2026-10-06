import { z } from 'zod'
import { m } from '@/paraglide/messages'
import { PAYMENT_METHODS } from './treasury'

/** A bookable common area: terrace, pool, gym... */
export const amenitySchema = z.object({
  // Unique in the DB (case-insensitive).
  name: z
    .string()
    .trim()
    .min(1, { error: () => m.common_name_required() }),
  // Proposed when booking; each reservation can change it. 0 = free.
  default_fee: z
    .number({ error: () => m.presidency_fee_required() })
    .nonnegative({ error: () => m.presidency_fee_nonnegative() }),
})

export type AmenityInput = z.infer<typeof amenitySchema>

/** One booking of a common area: the area, a house, a day, its price, optional notes. */
export const reservationSchema = z.object({
  amenity_id: z.uuid({ error: () => m.presidency_select_amenity() }),
  property_id: z.uuid({ error: () => m.common_select_house() }),
  // Unique in the DB per area: one live booking per area and day.
  reserved_on: z.iso.date({ error: () => m.common_invalid_date() }),
  // Optional fee (e.g. electricity), paid in full when booking; 0 = free.
  amount: z
    .number({ error: () => m.common_amount_required() })
    .nonnegative({ error: () => m.presidency_amount_nonnegative() }),
  notes: z.string().trim(),
})

export type ReservationInput = z.infer<typeof reservationSchema>

const transferNeedsReference = {
  path: ['reference'],
  error: () => m.presidency_reference_required(),
}

/** Treasurer collecting the fee: the income it becomes in Treasury. */
export const payReservationSchema = z
  .object({
    occurred_on: z.iso.date({ error: () => m.common_invalid_date() }),
    // Like every income: the paper receipt handed to the resident.
    folio: z
      .string()
      .trim()
      .min(1, { error: () => m.presidency_folio_required() }),
    payment_method: z.enum(PAYMENT_METHODS),
    reference: z.string().trim(),
    notes: z.string().trim(),
  })
  .refine((data) => data.payment_method !== 'transfer' || data.reference.length > 0, transferNeedsReference)

export type PayReservationInput = z.infer<typeof payReservationSchema>

/** Treasurer cancelling a paid booking; refund 0 = the house keeps nothing back. */
export const cancelReservationSchema = z
  .object({
    refund_amount: z
      .number({ error: () => m.common_amount_required() })
      .nonnegative({ error: () => m.presidency_amount_nonnegative() }),
    occurred_on: z.iso.date({ error: () => m.common_invalid_date() }),
    payment_method: z.enum(PAYMENT_METHODS),
    reference: z.string().trim(),
    notes: z.string().trim(),
  })
  .refine(
    (data) => data.refund_amount === 0 || data.payment_method !== 'transfer' || data.reference.length > 0,
    transferNeedsReference,
  )

export type CancelReservationInput = z.infer<typeof cancelReservationSchema>
