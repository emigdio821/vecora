import { isValidPhoneNumber } from 'react-phone-number-input'
import { z } from 'zod'

export const createOwnerSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  lastName: z.string().min(1, 'El apellido es requerido').max(100, 'El apellido es muy largo'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .refine(isValidPhoneNumber, { message: 'Teléfono inválido' }),
  email: z.email('Correo inválido').min(1, 'El correo es requerido').max(255, 'El correo es muy largo'),
  houseIds: z.array(z.uuid('ID de casa inválido')),
})

export type CreateOwnerFormData = z.infer<typeof createOwnerSchema>

export const updateOwnerSchema = z.object({
  ownerId: z.uuid(),
  firstName: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  lastName: z.string().min(1, 'El apellido es requerido').max(100, 'El apellido es muy largo'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .refine(isValidPhoneNumber, { message: 'Teléfono inválido' }),
  email: z.email('Correo inválido').min(1, 'El correo es requerido').max(255, 'El correo es muy largo'),
  houseIds: z.array(z.uuid('ID de casa inválido')),
})

export type UpdateOwnerFormData = z.infer<typeof updateOwnerSchema>

export const deleteOwnerSchema = z.object({
  ownerId: z.uuid('ID de propietario inválido'),
})

export type DeleteOwnerData = z.infer<typeof deleteOwnerSchema>
