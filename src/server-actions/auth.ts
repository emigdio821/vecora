import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@/lib/supabase/server'
import { type LoginInput, loginSchema, NO_ACCESS_MESSAGE } from '@/lib/validations/auth'

export type ActionResult = { error: string } | undefined

/** Navigation is left to the caller, which also drops the cached signed-out user. */
const loginFn = createServerFn({ method: 'POST' })
  .validator((input: LoginInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult> => {
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
  })

export const login = (input: LoginInput) => loginFn({ data: input })

/**
 * Spends the one-time access link from server-actions/hoa-board.ts, turning it
 * into a cookie session; the caller then sends the person to choose a
 * password, or back to /login?error=invite on an error. Only runs from the
 * Continue button on /auth/confirm: link previews (WhatsApp) and email
 * scanners open the URL with a GET, which must never use the token.
 */
const confirmAccessLinkFn = createServerFn({ method: 'POST' })
  .validator((data: { tokenHash: string; type: EmailOtpType }) => data)
  .handler(async ({ data: { tokenHash, type } }): Promise<ActionResult> => {
    const supabase = await createClient()

    // Drop a previous session from this browser only; other devices stay signed in.
    const { data: current } = await supabase.auth.getClaims()
    if (current) await supabase.auth.signOut({ scope: 'local' })

    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) return { error: 'El enlace de invitación ya no es válido' }
  })

export const confirmAccessLink = (tokenHash: string, type: EmailOtpType) =>
  confirmAccessLinkFn({ data: { tokenHash, type } })

/**
 * Signs the user out. Navigation is left to the caller so it can clear
 * client-side state (e.g. the TanStack Query cache) before redirecting.
 */
const logoutFn = createServerFn({ method: 'POST' }).handler(async (): Promise<ActionResult> => {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: 'No se pudo cerrar la sesión, intenta nuevamente' }
  }
})

export const logout = () => logoutFn()
