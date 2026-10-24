import { z } from 'zod'
import { m } from '@/paraglide/messages'

export const loginSchema = z.object({
  email: z.email({ error: () => m.auth_email_invalid() }),
  password: z.string().min(1, { error: () => m.auth_password_required() }),
})

export type LoginInput = z.infer<typeof loginSchema>

/** Choosing a password after an access link, or away from the main admin's default one. */
export const setPasswordSchema = z
  .object({
    password: z.string().min(8, { error: () => m.board_password_min() }),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    error: () => m.board_passwords_mismatch(),
  })

export type SetPasswordInput = z.infer<typeof setPasswordSchema>

/** The main admin's password, from Settings. Same rules as a new member's (setPasswordSchema). */
export const changePasswordSchema = z
  .object({
    current: z.string().min(1, { error: () => m.auth_password_required() }),
    password: z.string().min(8, { error: () => m.board_password_min() }),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    error: () => m.board_passwords_mismatch(),
  })
  .refine((data) => data.password !== data.current, {
    path: ['password'],
    error: () => m.auth_password_same(),
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
