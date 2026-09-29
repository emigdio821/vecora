import { z } from 'zod'
import { requiredText } from './requests'
import { PAYMENT_METHODS } from './treasury'

/** One booking of the terraza (event terrace): a house, a day, its price, optional notes. */
export const hallReservationSchema = z.object({
  property_id: z.uuid('Selecciona una casa'),
  // Unique in the DB: one live booking per day.
  reserved_on: z.iso.date('Fecha inválida'),
  // Paid in full when booking; 0 = sin costo.
  amount: z.number('Monto es requerido').nonnegative('El monto no puede ser negativo'),
  notes: z.string().trim(),
})

export type HallReservationInput = z.infer<typeof hallReservationSchema>

const transferNeedsReference = {
  path: ['reference'],
  message: 'La referencia es requerida para transferencias',
}

/** Treasurer collecting the rent: the income it becomes in "Tesorería". */
export const payHallReservationSchema = z
  .object({
    occurred_on: z.iso.date('Fecha inválida'),
    // Like every income: the paper receipt handed to the resident.
    folio: requiredText('Folio'),
    payment_method: z.enum(PAYMENT_METHODS),
    reference: z.string().trim(),
    notes: z.string().trim(),
  })
  .refine((data) => data.payment_method !== 'transfer' || data.reference.length > 0, transferNeedsReference)

export type PayHallReservationInput = z.infer<typeof payHallReservationSchema>

/** Treasurer cancelling a paid booking; refund 0 = the house keeps nothing back. */
export const cancelHallReservationSchema = z
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

export type CancelHallReservationInput = z.infer<typeof cancelHallReservationSchema>
