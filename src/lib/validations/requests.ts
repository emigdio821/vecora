import { z } from 'zod'
import { m } from '@/paraglide/messages'
import { PAYMENT_METHODS } from './treasury'

// Shared by the Maintenance and Security payment requests.

// Mirrors the `request_status` enum in the database.
export const REQUEST_STATUSES = ['pending', 'paid', 'rejected'] as const

export type RequestStatus = (typeof REQUEST_STATUSES)[number]

/** Treasurer paying a request: how and when the money went out. */
export const payRequestSchema = z
  .object({
    category_id: z.uuid({ error: () => m.requests_select_category() }),
    occurred_on: z.iso.date({ error: () => m.common_invalid_date() }),
    payment_method: z.enum(PAYMENT_METHODS),
    reference: z.string().trim(),
    notes: z.string().trim(),
  })
  .refine((data) => data.payment_method !== 'transfer' || data.reference.length > 0, {
    path: ['reference'],
    error: () => m.requests_reference_required(),
  })

export type PayRequestInput = z.infer<typeof payRequestSchema>

export const rejectRequestSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, { error: () => m.requests_reason_required() }),
})

export type RejectRequestInput = z.infer<typeof rejectRequestSchema>
