import { z } from 'zod'
import { Role } from '@/types/rbac'

export const createProfileSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  residentId: z.uuid('ID de residente inválido'),
  role: z.enum(Object.values(Role)),
})

export type CreateProfileFormData = z.infer<typeof createProfileSchema>

export const updateProfileSchema = z.object({
  profileId: z.uuid('ID de perfil inválido'),
  userId: z.string().min(1, 'El ID de usuario es requerido'),
  residentId: z.uuid('ID de residente inválido'),
  role: z.enum(Object.values(Role)),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').or(z.literal('')).optional(),
})

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

export const deleteProfileSchema = z.object({
  profileId: z.uuid('ID de perfil inválido'),
})

export type DeleteProfileData = z.infer<typeof deleteProfileSchema>

export const banProfileSchema = z.object({
  userId: z.string().min(1, 'El ID de usuario es requerido'),
  reason: z
    .string()
    .min(10, 'La razón debe tener al menos 10 caracteres')
    .max(200, 'La razón no puede exceder 200 caracteres')
    .optional(),
  duration: z.date().optional(),
})

export type BanProfileData = z.infer<typeof banProfileSchema>

export const unbanProfileSchema = z.object({
  userId: z.string().min(1, 'El ID de usuario es requerido'),
})

export type UnbanProfileData = z.infer<typeof unbanProfileSchema>
