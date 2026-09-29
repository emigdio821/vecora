import { z } from 'zod'
import { PAYMENT_METHODS } from './treasury'

// Shared by the "Mantenimiento" and "Seguridad" payment requests.

// Mirrors the `request_status` enum in the database.
export const REQUEST_STATUSES = ['pending', 'paid', 'rejected'] as const

export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const requiredText = (label: string) => z.string().trim().min(1, `${label} es requerido`)

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
