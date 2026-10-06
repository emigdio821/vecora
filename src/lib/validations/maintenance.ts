import { z } from 'zod'
import { m } from '@/paraglide/messages'

/** A job done (or a purchase made) that the treasurer should pay for. */
export const maintenanceRequestSchema = z.object({
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

export type MaintenanceRequestInput = z.infer<typeof maintenanceRequestSchema>
