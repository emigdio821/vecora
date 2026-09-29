import { isValidPhoneNumber } from 'libphonenumber-js'
import { z } from 'zod'
import { RELATIONSHIPS } from './houses'

const requiredText = (label: string) => z.string().trim().min(1, `${label} es requerido`)

const residentSchema = z.object({
  first_name: requiredText('Nombre'),
  last_name: requiredText('Apellido'),
  // Checks length and prefix for the chosen country; PhoneInput sends E.164 ("+52…").
  phone: requiredText('Teléfono').refine(isValidPhoneNumber, 'Número de teléfono inválido'),
  // Optional in the registry; required later when an account is created for
  // the resident. The form always sends a string, so '' means "none" and the
  // action stores it as null. Unique in the DB when present.
  email: z
    .string()
    .trim()
    .pipe(z.email('Correo inválido').or(z.literal(''))),
  notes: z.string().trim(),
})

export const createResidentSchema = residentSchema.extend({
  // Optional house to link on creation; `relationship` is ignored without one.
  property_id: z.uuid().nullable(),
  relationship: z.enum(RELATIONSHIPS, 'Selecciona el tipo de relación'),
})

export type CreateResidentInput = z.infer<typeof createResidentSchema>

// Houses are managed from the resident's links once they exist.
export const updateResidentSchema = residentSchema

export type UpdateResidentInput = z.infer<typeof updateResidentSchema>
