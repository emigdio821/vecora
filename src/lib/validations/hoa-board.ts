import { z } from 'zod'

// Mirrors the `app_role` enum in the database.
export const APP_ROLES = ['admin', 'president', 'treasurer', 'security', 'maintenance'] as const

export type AppRole = (typeof APP_ROLES)[number]

const rolesField = z.array(z.enum(APP_ROLES)).min(1, 'Selecciona al menos un cargo')

/** Give a resident an account and seat them on the board. */
export const addBoardMemberSchema = z.object({
  resident_id: z.uuid('Selecciona un residente'),
  roles: rolesField,
})

export type AddBoardMemberInput = z.infer<typeof addBoardMemberSchema>

export const updateBoardMemberRolesSchema = z.object({
  roles: rolesField,
})

export type UpdateBoardMemberRolesInput = z.infer<typeof updateBoardMemberRolesSchema>

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden',
  })

export type SetPasswordInput = z.infer<typeof setPasswordSchema>
