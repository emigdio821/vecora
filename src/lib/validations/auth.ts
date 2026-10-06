import { z } from 'zod'
import { m } from '@/paraglide/messages'

export const loginSchema = z.object({
  email: z.email({ error: () => m.auth_email_invalid() }),
  password: z.string().min(1, { error: () => m.auth_password_required() }),
})

export type LoginInput = z.infer<typeof loginSchema>
