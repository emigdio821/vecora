import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestHeaders, setCookie } from '@tanstack/react-start/server'
import { isAPIError } from 'better-auth/api'
import { auth, NOT_ON_THE_BOARD } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth/current-user'
import { authMiddleware } from '@/lib/auth/middleware'
import { MULTI_LANGUAGE } from '@/lib/config/i18n'
import { withUser } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import {
  type ChangePasswordInput,
  changePasswordSchema,
  type LoginInput,
  loginSchema,
} from '@/lib/validations/auth'
import { LANGUAGE_PICKED_COOKIE } from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import { cookieMaxAge, cookieName, type Locale } from '@/paraglide/runtime'

export type ActionResult = { error: string } | undefined

/**
 * `locale`: the device had no language picked, so it now starts in the HOA's.
 * If it differs from the page's, the caller reloads instead of navigating.
 */
export type SignInResult = { error?: string; locale?: Locale } | undefined

/** The error code Better Auth answered with, if it was one of its own. */
function authErrorCode(error: unknown): string | undefined {
  if (!isAPIError(error)) return undefined
  return error.body?.code
}

/**
 * A device whose visitor never picked a language follows the browser until
 * someone signs in; from then on it's in the HOA's default language. Writes
 * Paraglide's cookie, so a later pick in the language menu replaces it.
 *
 * Takes the user: the session cookie was only just set, so this request
 * doesn't carry it yet.
 */
async function adoptHoaLanguage(userId: string): Promise<Locale | undefined> {
  if (!MULTI_LANGUAGE || getCookie(LANGUAGE_PICKED_COOKIE)) return undefined

  const [row] = await withUser(userId, (tx) =>
    tx.select({ defaultLanguage: settings.defaultLanguage }).from(settings).limit(1),
  )
  if (!row || row.defaultLanguage === getCookie(cookieName)) return undefined

  setCookie(cookieName, row.defaultLanguage, { path: '/', maxAge: cookieMaxAge, sameSite: 'lax' })
  return row.defaultLanguage
}

/** Navigation is left to the caller, which also drops the cached signed-out user. */
const loginFn = createServerFn({ method: 'POST' })
  .validator((input: LoginInput) => input)
  .handler(async ({ data: input }): Promise<SignInResult> => {
    const parsed = loginSchema.safeParse(input)

    if (!parsed.success) {
      return { error: m.auth_credentials_required() }
    }

    let userId: string
    try {
      const signedIn = await auth.api.signInEmail({ body: parsed.data, headers: getRequestHeaders() })
      userId = signedIn.user.id
    } catch (error) {
      // Only board members (accounts with a role) may use the app. Someone taken
      // off the board keeps their account, for history, but is turned away here
      // (src/lib/auth/index.ts refuses them a session).
      if (authErrorCode(error) === NOT_ON_THE_BOARD) {
        return { error: m.auth_no_access_message() }
      }
      if (isAPIError(error)) {
        return { error: m.auth_credentials_invalid() }
      }
      throw error
    }

    return { locale: await adoptHoaLanguage(userId) }
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
  .validator((token: string) => token)
  .handler(async ({ data: token }): Promise<SignInResult> => {
    const headers = getRequestHeaders()

    // Drop a previous session from this browser only; other devices stay signed in.
    const current = await auth.api.getSession({ headers })
    if (current) await auth.api.signOut({ headers })

    let userId: string
    try {
      const verified = await auth.api.magicLinkVerify({ query: { token }, headers })
      userId = verified.user.id
    } catch (error) {
      // Expired, already used, or the person left the board since.
      if (isAPIError(error)) {
        return { error: m.auth_invite_invalid_title() }
      }
      throw error
    }

    return { locale: await adoptHoaLanguage(userId) }
  })

export const confirmAccessLink = (token: string) => confirmAccessLinkFn({ data: token })

/**
 * Signs the user out. Navigation is left to the caller so it can clear
 * client-side state (e.g. the TanStack Query cache) before redirecting.
 */
const logoutFn = createServerFn({ method: 'POST' }).handler(async (): Promise<ActionResult> => {
  try {
    await auth.api.signOut({ headers: getRequestHeaders() })
  } catch (error) {
    console.error('signOut failed', error)
    return { error: m.auth_logout_failed() }
  }
})

export const logout = () => logoutFn()

/**
 * The main admin's password, from Settings. Nobody receives mail at
 * vecora.app, and the board's access links are for members; this is the only
 * way to change it without the SQL Editor.
 */
const changePasswordFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: ChangePasswordInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult> => {
    const parsed = changePasswordSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const user = await getCurrentUser()
    if (!user?.isMainAdmin) {
      return { error: m.common_no_permission() }
    }

    // An open session isn't enough: whoever is at the keyboard must know the
    // current one. Every other device signs in again with the new password.
    try {
      await auth.api.changePassword({
        body: {
          currentPassword: parsed.data.current,
          newPassword: parsed.data.password,
          revokeOtherSessions: true,
        },
        headers: getRequestHeaders(),
      })
    } catch (error) {
      if (authErrorCode(error) === 'INVALID_PASSWORD') {
        return { error: m.auth_current_password_wrong() }
      }
      console.error('changePassword failed', error)
      return { error: m.board_password_save_failed() }
    }
  })

export const changePassword = (input: ChangePasswordInput) => changePasswordFn({ data: input })
