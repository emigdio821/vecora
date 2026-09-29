import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Correo inválido'),
  password: z.string().min(1, 'Contraseña es requerida'),
})

export type LoginInput = z.infer<typeof loginSchema>

/** Shown by login() and /no-access to accounts without a board role. */
export const NO_ACCESS_MESSAGE =
  'Tu cuenta no tiene acceso a la aplicación. Solo la mesa directiva puede entrar; si eres parte de ella, pide al presidente que te agregue.'
