import { z } from 'zod'
import { PAYMENT_METHODS } from './treasury'

// Mirrors the `maintenance_request_status` enum in the database.
export const REQUEST_STATUSES = ['pending', 'paid', 'rejected'] as const

export type RequestStatus = (typeof REQUEST_STATUSES)[number]

const requiredText = (label: string) => z.string().trim().min(1, `${label} es requerido`)

/** A job done (or a purchase made) that the treasurer should pay for. */
export const maintenanceRequestSchema = z.object({
  title: requiredText('Concepto'),
  details: z.string().trim(),
  amount: z.number('Monto es requerido').positive('El monto debe ser mayor a cero'),
  requested_on: z.iso.date('Fecha inválida'),
})

export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>

/** Treasurer paying a request: how and when the money went out. */
export const payRequestSchema = z
  .object({
    category_id: z.uuid('Selecciona una categoría'),
    occurred_on: z.iso.date('Fecha inválida'),
    payment_method: z.enum(PAYMENT_METHODS),
    reference: z.string().trim(),
    notes: z.string().trim(),
  })
  .refine((data) => data.payment_method !== 'transfer' || data.reference.length > 0, {
    path: ['reference'],
    message: 'La referencia es requerida para transferencias',
  })

export type PayRequestInput = z.infer<typeof payRequestSchema>

export const rejectRequestSchema = z.object({
  reason: requiredText('El motivo'),
})

export type RejectRequestInput = z.infer<typeof rejectRequestSchema>
