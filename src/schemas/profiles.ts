import { z } from 'zod'
import { profileTypeEnum } from '@/db/schema'

export const createProfileSchema = z
  .object({
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    profileType: z.enum(profileTypeEnum.enumValues, 'Tipo de perfil inválido'),
    ownerId: z.uuid('ID de propietario inválido').nullish(),
    externalUserId: z.uuid('ID de usuario externo inválido').nullish(),
    roleIds: z.array(z.uuid('ID de rol inválido')).min(1, 'Debe seleccionar al menos un rol'),
  })
  .refine(
    (data) => {
      if (data.profileType === 'owner') {
        return data.ownerId !== null && data.externalUserId === null
      }
      if (data.profileType === 'external') {
        return data.externalUserId !== null && data.ownerId === null
      }
      return false
    },
    {
      message: 'Tienes que seleccionar el propietario o usuario externo según el tipo de perfil',
      path: ['profileType'],
    },
  )

export type CreateProfileFormData = z.infer<typeof createProfileSchema>

export const updateProfileSchema = z
  .object({
    profileId: z.uuid('ID de perfil inválido'),
    userId: z.string().min(1, 'El ID de usuario es requerido'),
    profileType: z.enum(profileTypeEnum.enumValues, 'Tipo de perfil inválido'),
    ownerId: z.uuid('ID de propietario inválido').nullish(),
    externalUserId: z.uuid('ID de usuario externo inválido').nullish(),
    roleIds: z.array(z.uuid('ID de rol inválido')).min(1, 'Debe seleccionar al menos un rol'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .or(z.literal(''))
      .optional(),
  })
  .refine(
    (data) => {
      if (data.profileType === 'owner') {
        return data.ownerId !== null && data.externalUserId === null
      }
      if (data.profileType === 'external') {
        return data.externalUserId !== null && data.ownerId === null
      }
      return false
    },
    {
      message: 'Tienes que seleccionar el propietario o usuario externo según el tipo de perfil',
      path: ['profileType'],
    },
  )

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
