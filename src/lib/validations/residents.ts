import { isValidPhoneNumber } from 'libphonenumber-js'
import { z } from 'zod'
import { m } from '@/paraglide/messages'
import { RELATIONSHIPS } from './houses'

const requiredText = (message: () => string) => z.string().trim().min(1, { error: message })

const residentSchema = z.object({
  first_name: requiredText(() => m.residential_first_name_required()),
  last_name: requiredText(() => m.residential_last_name_required()),
  // Checks length and prefix for the chosen country; PhoneInput sends E.164 ("+52…").
  phone: requiredText(() => m.residential_phone_required()).refine(isValidPhoneNumber, {
    error: () => m.residential_phone_invalid(),
  }),
  // Optional in the registry; required later when an account is created for
  // the resident. The form always sends a string, so '' means "none" and the
  // action stores it as null. Unique in the DB when present.
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: () => m.residential_email_invalid() }).or(z.literal(''))),
  notes: z.string().trim(),
})

export const createResidentSchema = residentSchema.extend({
  // Optional house to link on creation; `relationship` is ignored without one.
  property_id: z.uuid().nullable(),
  relationship: z.enum(RELATIONSHIPS, { error: () => m.residential_relationship_required() }),
})

export type CreateResidentInput = z.infer<typeof createResidentSchema>

// Houses are managed from the resident's links once they exist.
export const updateResidentSchema = residentSchema

export type UpdateResidentInput = z.infer<typeof updateResidentSchema>
