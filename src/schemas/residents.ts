import { isValidPhoneNumber } from 'react-phone-number-input'
import { z } from 'zod'

export const createResidentSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  lastName: z.string().min(1, 'El apellido es requerido').max(100, 'El apellido es muy largo'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .refine(isValidPhoneNumber, { message: 'Teléfono inválido' }),
  email: z.email('Correo inválido').min(1, 'El correo es requerido').max(255, 'El correo es muy largo'),
  isOwner: z.boolean().default(false),
  notes: z.string().max(200, 'Las notas son muy largas').optional(),
  houseIds: z.array(z.uuid('ID de casa inválido')).optional(),
})

export type CreateResidentFormData = z.infer<typeof createResidentSchema>

export const updateResidentSchema = z.object({
  residentId: z.uuid(),
  firstName: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  lastName: z.string().min(1, 'El apellido es requerido').max(100, 'El apellido es muy largo'),
  phone: z
    .string()
    .min(1, 'El teléfono es requerido')
    .refine(isValidPhoneNumber, { message: 'Teléfono inválido' }),
  email: z.email('Correo inválido').min(1, 'El correo es requerido').max(255, 'El correo es muy largo'),
  isOwner: z.boolean().default(false),
  notes: z.string().max(200, 'Las notas son muy largas').optional(),
  houseIds: z.array(z.uuid('ID de casa inválido')).optional(),
})

export type UpdateResidentFormData = z.infer<typeof updateResidentSchema>

export const deleteResidentSchema = z.object({
  residentId: z.uuid('ID de residente inválido'),
})

export type DeleteResidentData = z.infer<typeof deleteResidentSchema>
