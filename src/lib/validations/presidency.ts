import { z } from 'zod'
import { requiredText } from './requests'
import { PAYMENT_METHODS } from './treasury'

/** A bookable common area: terrace, pool, gym... */
export const amenitySchema = z.object({
  // Unique in the DB (case-insensitive).
  name: requiredText('Nombre'),
  // Proposed when booking; each reservation can change it. 0 = free.
  default_fee: z.number('Tarifa es requerida').nonnegative('La tarifa no puede ser negativa'),
})

export type AmenityInput = z.infer<typeof amenitySchema>

/** One booking of a common area: the area, a house, a day, its price, optional notes. */
export const reservationSchema = z.object({
  amenity_id: z.uuid('Selecciona un área'),
  property_id: z.uuid('Selecciona una casa'),
  // Unique in the DB per area: one live booking per area and day.
  reserved_on: z.iso.date('Fecha inválida'),
  // Optional fee (e.g. electricity), paid in full when booking; 0 = free.
  amount: z.number('Monto es requerido').nonnegative('El monto no puede ser negativo'),
  notes: z.string().trim(),
})

export type ReservationInput = z.infer<typeof reservationSchema>

const transferNeedsReference = {
  path: ['reference'],
  message: 'La referencia es requerida para transferencias',
}

/** Treasurer collecting the fee: the income it becomes in Treasury. */
export const payReservationSchema = z
  .object({
    occurred_on: z.iso.date('Fecha inválida'),
    // Like every income: the paper receipt handed to the resident.
    folio: requiredText('Folio'),
    payment_method: z.enum(PAYMENT_METHODS),
    reference: z.string().trim(),
    notes: z.string().trim(),
  })
  .refine((data) => data.payment_method !== 'transfer' || data.reference.length > 0, transferNeedsReference)

export type PayReservationInput = z.infer<typeof payReservationSchema>

/** Treasurer cancelling a paid booking; refund 0 = the house keeps nothing back. */
export const cancelReservationSchema = z
  .object({
    refund_amount: z.number('Monto es requerido').nonnegative('El monto no puede ser negativo'),
    occurred_on: z.iso.date('Fecha inválida'),
    payment_method: z.enum(PAYMENT_METHODS),
    reference: z.string().trim(),
    notes: z.string().trim(),
  })
  .refine(
    (data) => data.refund_amount === 0 || data.payment_method !== 'transfer' || data.reference.length > 0,
    transferNeedsReference,
  )

export type CancelReservationInput = z.infer<typeof cancelReservationSchema>
