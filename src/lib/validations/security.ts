import { z } from 'zod'
import { m } from '@/paraglide/messages'

// Mirrors the `security_request_kind` enum in the database.
export const SECURITY_REQUEST_KINDS = ['cameras', 'guards', 'access', 'equipment', 'other'] as const

export type SecurityRequestKind = (typeof SECURITY_REQUEST_KINDS)[number]

/** A security expense (cameras, guards, gates...) that the treasurer should pay for. */
export const securityRequestSchema = z.object({
  kind: z.enum(SECURITY_REQUEST_KINDS, { error: () => m.requests_security_select_kind() }),
  title: z
    .string()
    .trim()
    .min(1, { error: () => m.requests_title_required() }),
  details: z.string().trim(),
  amount: z
    .number({ error: () => m.common_amount_required() })
    .positive({ error: () => m.common_amount_positive() }),
  requested_on: z.iso.date({ error: () => m.common_invalid_date() }),
})

export type SecurityRequestInput = z.infer<typeof securityRequestSchema>
