import { z } from 'zod'
import { m } from '@/paraglide/messages'

/** Days the PDF report covers, both inclusive. Read from the URL by the route handler. */
export const reportRangeSchema = z
  .object({
    from: z.iso.date({ error: () => m.common_invalid_date() }),
    to: z.iso.date({ error: () => m.common_invalid_date() }),
  })
  .refine((data) => data.from <= data.to, {
    path: ['to'],
    error: () => m.reports_range_end_before_start(),
  })

export type ReportRange = z.infer<typeof reportRangeSchema>
