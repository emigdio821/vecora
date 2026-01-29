import { z } from 'zod'
import { profileTypeEnum } from '@/db/schemas/main'

export const createProfileSchema = z
  .object({
    userId: z.string().min(1, 'El ID de usuario es requerido'),
    profileType: z.enum(profileTypeEnum.enumValues, 'Tipo de perfil inválido'),
    ownerId: z.uuid('ID de propietario inválido').nullable(),
    externalUserId: z.uuid('ID de usuario externo inválido').nullable(),
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
      message: 'Debe seleccionar el propietario o usuario externo según el tipo de perfil',
      path: ['profileType'],
    },
  )

export type CreateProfileFormData = z.infer<typeof createProfileSchema>

export const updateProfileSchema = z
  .object({
    profileId: z.uuid('ID de perfil inválido'),
    userId: z.string().min(1, 'El ID de usuario es requerido'),
    profileType: z.enum(profileTypeEnum.enumValues, 'Tipo de perfil inválido'),
    ownerId: z.uuid('ID de propietario inválido').nullable(),
    externalUserId: z.uuid('ID de usuario externo inválido').nullable(),
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
      message: 'Debe seleccionar el propietario o usuario externo según el tipo de perfil',
      path: ['profileType'],
    },
  )

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>

export const deleteProfileSchema = z.object({
  profileId: z.uuid('ID de perfil inválido'),
})

export type DeleteProfileData = z.infer<typeof deleteProfileSchema>
