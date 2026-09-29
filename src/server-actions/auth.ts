'use server'

import type { EmailOtpType } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type LoginInput, loginSchema, NO_ACCESS_MESSAGE } from '@/lib/validations/auth'

export type ActionResult = { error: string } | undefined

export async function login(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)

  if (!parsed.success) {
    return { error: 'Correo y contraseña son requeridos' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) {
    return { error: 'Correo o contraseña inválidos' }
  }

  // Only board members (accounts with a role) may use the app. Someone taken
  // off the board keeps their account, for history, but is turned away here.
  const { count } = await supabase
    .from('user_roles')
    .select('role', { count: 'exact', head: true })
    .eq('user_id', data.user.id)

  if (!count) {
    await supabase.auth.signOut()
    return { error: NO_ACCESS_MESSAGE }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

/**
 * Spends the one-time access link from server-actions/hoa-board.ts, turning it
 * into a cookie session, then sends the person to choose a password. Only
 * runs from the "Continuar" button on /auth/confirm: link previews (WhatsApp)
 * and email scanners open the URL with a GET, which must never use the token.
 */
export async function confirmAccessLink(tokenHash: string, type: EmailOtpType): Promise<ActionResult> {
  const supabase = await createClient()

  // Drop a previous session from this browser only; other devices stay signed in.
  const { data: current } = await supabase.auth.getClaims()
  if (current) await supabase.auth.signOut({ scope: 'local' })

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
  if (error) redirect('/login?error=invite')

  revalidatePath('/', 'layout')
  redirect('/set-password')
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
