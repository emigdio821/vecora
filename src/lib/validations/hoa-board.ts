import { z } from 'zod'
import { m } from '@/paraglide/messages'

// Mirrors the `app_role` enum in the database.
export const APP_ROLES = ['admin', 'president', 'treasurer', 'security', 'maintenance'] as const

export type AppRole = (typeof APP_ROLES)[number]

const rolesField = z.array(z.enum(APP_ROLES)).min(1, { error: () => m.board_select_role() })

/** Give a resident an account and seat them on the board. */
export const addBoardMemberSchema = z.object({
  resident_id: z.uuid({ error: () => m.board_select_resident() }),
  roles: rolesField,
})

export type AddBoardMemberInput = z.infer<typeof addBoardMemberSchema>

export const updateBoardMemberRolesSchema = z.object({
  roles: rolesField,
})

export type UpdateBoardMemberRolesInput = z.infer<typeof updateBoardMemberRolesSchema>

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
