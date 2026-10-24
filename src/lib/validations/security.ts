import { z } from 'zod'
import { SECURITY_REQUEST_KINDS } from '@/lib/enums'
import { m } from '@/paraglide/messages'

export { SECURITY_REQUEST_KINDS, type SecurityRequestKind } from '@/lib/enums'

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
  requestedOn: z.iso.date({ error: () => m.common_invalid_date() }),
})

export type SecurityRequestInput = z.infer<typeof securityRequestSchema>
