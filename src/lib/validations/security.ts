import { z } from 'zod'
import { requiredText } from './requests'

// Mirrors the `security_request_kind` enum in the database.
export const SECURITY_REQUEST_KINDS = ['cameras', 'guards', 'access', 'equipment', 'other'] as const

export type SecurityRequestKind = (typeof SECURITY_REQUEST_KINDS)[number]

/** A security expense (cameras, guards, gates...) that the treasurer should pay for. */
export const securityRequestSchema = z.object({
  kind: z.enum(SECURITY_REQUEST_KINDS, 'Selecciona un tipo'),
  title: requiredText('Concepto'),
  details: z.string().trim(),
  amount: z.number('Monto es requerido').positive('El monto debe ser mayor a cero'),
  requested_on: z.iso.date('Fecha inválida'),
})

export type SecurityRequestInput = z.infer<typeof securityRequestSchema>
