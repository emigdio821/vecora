import { z } from 'zod'
import { m } from '@/paraglide/messages'
import { PAYMENT_METHODS } from './treasury'

// Shared by the Maintenance and Security payment requests.

export { REQUEST_STATUSES, type RequestStatus } from '@/lib/enums'

/** Treasurer paying a request: how and when the money went out. */
export const payRequestSchema = z
  .object({
    categoryId: z.uuid({ error: () => m.requests_select_category() }),
    occurredOn: z.iso.date({ error: () => m.common_invalid_date() }),
    paymentMethod: z.enum(PAYMENT_METHODS),
    reference: z.string().trim(),
    notes: z.string().trim(),
  })
  .refine((data) => data.paymentMethod !== 'transfer' || data.reference.length > 0, {
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
