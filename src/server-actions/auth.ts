'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type LoginInput, loginSchema } from '@/lib/validations/auth'

export type ActionResult = { error: string } | undefined

export async function login(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)

  if (!parsed.success) {
    return { error: 'Correo y contraseña son requeridos' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Correo o contraseña inválidos' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Signs the user out. Navigation is left to the caller so it can clear
 * client-side state (e.g. the TanStack Query cache) before redirecting.
 */
export async function logout(): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: 'No se pudo cerrar la sesión, intenta nuevamente' }
  }

  revalidatePath('/', 'layout')
}
