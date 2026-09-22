import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Correo inválido'),
  password: z.string().min(1, 'Contraseña es requerida'),
})

export type LoginInput = z.infer<typeof loginSchema>
