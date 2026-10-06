import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'
import { MULTI_LANGUAGE } from '@/lib/config/i18n'
import { createClient } from '@/lib/supabase/server'
import { type LoginInput, loginSchema } from '@/lib/validations/auth'
import { LANGUAGE_PICKED_COOKIE } from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import { cookieMaxAge, cookieName, type Locale } from '@/paraglide/runtime'

export type ActionResult = { error: string } | undefined

/**
 * `locale`: the device had no language picked, so it now starts in the HOA's.
 * If it differs from the page's, the caller reloads instead of navigating.
 */
export type SignInResult = { error?: string; locale?: Locale } | undefined

type ServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * A device whose visitor never picked a language follows the browser until
 * someone signs in; from then on it's in the HOA's default language. Writes
 * Paraglide's cookie, so a later pick in the language menu replaces it.
 */
async function adoptHoaLanguage(supabase: ServerClient): Promise<Locale | undefined> {
  if (!MULTI_LANGUAGE || getCookie(LANGUAGE_PICKED_COOKIE)) return undefined

  const { data } = await supabase.from('settings').select('default_language').maybeSingle()
  if (!data || data.default_language === getCookie(cookieName)) return undefined

  setCookie(cookieName, data.default_language, { path: '/', maxAge: cookieMaxAge, sameSite: 'lax' })
  return data.default_language
}

/** Navigation is left to the caller, which also drops the cached signed-out user. */
const loginFn = createServerFn({ method: 'POST' })
  .validator((input: LoginInput) => input)
  .handler(async ({ data: input }): Promise<SignInResult> => {
    const parsed = loginSchema.safeParse(input)

    if (!parsed.success) {
      return { error: m.auth_credentials_required() }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data)

    if (error) {
      return { error: m.auth_credentials_invalid() }
    }

    // Only board members (accounts with a role) may use the app. Someone taken
    // off the board keeps their account, for history, but is turned away here.
    const { count } = await supabase
      .from('user_roles')
      .select('role', { count: 'exact', head: true })
      .eq('user_id', data.user.id)

    if (!count) {
      await supabase.auth.signOut()
      return { error: m.auth_no_access_message() }
    }

    return { locale: await adoptHoaLanguage(supabase) }
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
  .handler(async ({ data: { tokenHash, type } }): Promise<SignInResult> => {
    const supabase = await createClient()

    // Drop a previous session from this browser only; other devices stay signed in.
    const { data: current } = await supabase.auth.getClaims()
    if (current) await supabase.auth.signOut({ scope: 'local' })

    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (error) return { error: m.auth_invite_invalid_title() }

    return { locale: await adoptHoaLanguage(supabase) }
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
    return { error: m.auth_logout_failed() }
  }
})

export const logout = () => logoutFn()
