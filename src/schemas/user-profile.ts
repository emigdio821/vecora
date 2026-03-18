import { z } from 'zod'
import { emailSchema, passwordSchema } from './shared'

export const updateUserProfileSchema = z
  .object({
    name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
    email: emailSchema,
    password: passwordSchema.or(z.literal('')).optional(),
    newPassword: passwordSchema.or(z.literal('')).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password && !data.newPassword) {
      ctx.addIssue({
        code: 'custom',
        message: 'La nueva contraseña es requerida',
        path: ['newPassword'],
      })
    }
  })

export type UpdateUserProfileFormData = z.infer<typeof updateUserProfileSchema>
