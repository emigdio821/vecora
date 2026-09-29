import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Correo inválido'),
  password: z.string().min(1, 'Contraseña es requerida'),
})

export type LoginInput = z.infer<typeof loginSchema>

/** Shown by login() and /no-access to accounts without a board role. */
export const NO_ACCESS_MESSAGE =
  'Tu cuenta aún no tiene acceso a la aplicación. Si deberías tenerlo, pide a un administrador que te lo dé.'
