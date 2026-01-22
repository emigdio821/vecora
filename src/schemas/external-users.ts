import { isValidPhoneNumber } from 'react-phone-number-input'
import { z } from 'zod'

export const createExternalUserSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  lastName: z.string().min(1, 'El apellido es requerido').max(100, 'El apellido es muy largo'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .refine(isValidPhoneNumber, { message: 'Teléfono inválido' }),
  email: z.email('Correo inválido').min(1, 'El correo es requerido').max(255, 'El correo es muy largo'),
})

export type CreateExternalUserFormData = z.infer<typeof createExternalUserSchema>

export const updateExternalUserSchema = z.object({
  externalUserId: z.uuid(),
  firstName: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  lastName: z.string().min(1, 'El apellido es requerido').max(100, 'El apellido es muy largo'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .refine(isValidPhoneNumber, { message: 'Teléfono inválido' }),
  email: z.email('Correo inválido').min(1, 'El correo es requerido').max(255, 'El correo es muy largo'),
})

export type UpdateExternalUserFormData = z.infer<typeof updateExternalUserSchema>

export const deleteExternalUserSchema = z.object({
  externalUserId: z.uuid('ID de usuario externo inválido'),
})

export type DeleteExternalUserData = z.infer<typeof deleteExternalUserSchema>
