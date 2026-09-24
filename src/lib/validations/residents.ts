import { z } from 'zod'

const requiredText = (label: string) => z.string().trim().min(1, `${label} es requerido`)

export const createResidentSchema = z.object({
  first_name: requiredText('Nombre'),
  last_name: requiredText('Apellido'),
  phone: requiredText('Teléfono'),
  // Optional in the registry; required later when an account is created for
  // the resident. The form always sends a string, so '' means "none" and the
  // action stores it as null. Unique in the DB when present.
  email: z
    .string()
    .trim()
    .pipe(z.email('Correo inválido').or(z.literal(''))),
  notes: z.string().trim(),
})

export type CreateResidentInput = z.infer<typeof createResidentSchema>

// Same fields for now; kept separate so they can diverge later.
export const updateResidentSchema = createResidentSchema

export type UpdateResidentInput = z.infer<typeof updateResidentSchema>
