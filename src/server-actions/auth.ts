import { createServerFn } from '@tanstack/react-start'
import { getCookie, getRequestHeaders, setCookie } from '@tanstack/react-start/server'
import { isAPIError } from 'better-auth/api'
import type { ActionResult } from '@/lib/action-result'
import { auth } from '@/lib/auth'
import { sessionMiddleware } from '@/lib/auth/middleware'
import { MULTI_LANGUAGE } from '@/lib/config/i18n'
import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import {
  type ChangePasswordInput,
  changePasswordSchema,
  type SetPasswordInput,
  setPasswordSchema,
} from '@/lib/validations/auth'
import { LANGUAGE_PICKED_COOKIE } from '@/lib/validations/settings'
import { m } from '@/paraglide/messages'
import { cookieMaxAge, cookieName, type Locale } from '@/paraglide/runtime'

// Signing in with a password and signing out go through Better Auth's own
// endpoints (src/lib/auth/client.ts), which rate-limit the sign-in. These are
// the steps around them that need the server.

/** The error code Better Auth answered with, if it was one of its own. */
function authErrorCode(error: unknown): string | undefined {
  if (!isAPIError(error)) {
    return undefined
  }
  return error.body?.code
}

/**
 * A device whose visitor never picked a language follows the browser until
 * someone signs in; from then on it's in the HOA's default language. Writes
 * Paraglide's cookie, so a later pick in the language menu replaces it.
 * Returns the new language, or undefined when nothing changed.
 */
async function adoptHoaLanguage(): Promise<Locale | undefined> {
  if (!MULTI_LANGUAGE || getCookie(LANGUAGE_PICKED_COOKIE)) {
    return undefined
  }

  const [row] = await db.select({ defaultLanguage: settings.defaultLanguage }).from(settings).limit(1)
  if (!row || row.defaultLanguage === getCookie(cookieName)) {
    return undefined
  }

  setCookie(cookieName, row.defaultLanguage, { path: '/', maxAge: cookieMaxAge, sameSite: 'lax' })
  return row.defaultLanguage
}

/**
 * Right after a sign-in: the HOA's language, if the device takes it. When it
 * differs from the page's, the caller reloads instead of navigating.
 */
export const afterSignIn = createServerFn({ method: 'POST' })
  .middleware([sessionMiddleware])
  .handler(async () => {
    return { locale: await adoptHoaLanguage() }
  })

export type ConfirmResult = { error: string } | { locale: Locale | undefined }

/**
 * Spends the one-time access link (src/server-actions/hoa-board.ts), turning
 * it into a session; the caller then sends the person to choose a password,
 * or back to /login?error=invite on an error. Only runs from the Continue
 * button on /auth/confirm: link previews (WhatsApp) and email scanners open
 * the URL with a GET, which must never spend the token.
 */
const confirmAccessLinkFn = createServerFn({ method: 'POST' })
  .validator((token: string) => token)
  .handler(async ({ data: token }): Promise<ConfirmResult> => {
    const headers = getRequestHeaders()

    // Drop a previous session from this browser only; other devices stay signed in.
    const current = await auth.api.getSession({ headers })
    if (current) {
      await auth.api.signOut({ headers })
    }

    try {
      await auth.api.magicLinkVerify({ query: { token }, headers })
    } catch (error) {
      // Expired, already used, or the person left the board since.
      if (isAPIError(error)) {
        return { error: m.auth_invite_invalid_title() }
      }
      throw error
    }

    return { locale: await adoptHoaLanguage() }
  })

export const confirmAccessLink = (token: string) => confirmAccessLinkFn({ data: token })

/**
 * First sign-in after an access link: the person chooses their password (a
 * new member, or someone who forgot theirs). Also the main admin's first
 * sign-in, away from the default password.
 *
 * No current password is asked for, so only those two kinds of session may
 * use it. Everyone else changes theirs with an access link (or, the main
 * admin, in Settings).
 */
const setPasswordFn = createServerFn({ method: 'POST' })
  .middleware([sessionMiddleware])
  .validator((input: SetPasswordInput) => input)
  .handler(async ({ data: input, context: { user } }): Promise<ActionResult> => {
    const parsed = setPasswordSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }
    if (!user.mustSetPassword && !user.mustChangePassword) {
      return { error: m.common_no_permission() }
    }

    const { password } = parsed.data
    try {
      const context = await auth.$context
      const credential = await context.internalAdapter.findCredentialAccount(user.id)

      let isSamePassword = false
      if (credential?.password) {
        isSamePassword = await context.password.verify({ hash: credential.password, password })
      }
      // Someone resetting who typed the password they already had: it's still
      // theirs, let them in. Unless it's the default one being replaced.
      if (isSamePassword && user.mustChangePassword) {
        return { error: m.auth_password_same_as_default() }
      }

      if (!isSamePassword) {
        const hash = await context.password.hash(password)
        if (credential) {
          await context.internalAdapter.updatePassword(user.id, hash)
        } else {
          await context.internalAdapter.createAccount({
            userId: user.id,
            providerId: 'credential',
            accountId: user.id,
            password: hash,
          })
        }
      }
      // After the password, so the activity log leaves the default one's
      // replacement out (setup, not something the board did).
      if (user.mustChangePassword) {
        await context.internalAdapter.updateUser(user.id, { mustChangePassword: false })
      }

      // Sign out every device, this access-link session included: it stays
      // marked as such (see CurrentUser.mustSetPassword), so it's replaced below.
      await context.internalAdapter.deleteUserSessions(user.id)
    } catch (error) {
      console.error('setPassword failed', error)
      return { error: m.board_password_save_failed() }
    }

    try {
      await auth.api.signInEmail({ body: { email: user.email, password }, headers: getRequestHeaders() })
    } catch (error) {
      console.error('signInEmail after setPassword failed', error)
      return { error: m.board_password_saved_sign_in_failed() }
    }

    return { data: undefined }
  })

export const setPassword = (input: SetPasswordInput) => setPasswordFn({ data: input })

/**
 * The main admin's password, from Settings. Nobody receives mail at
 * vecora.app, and the board's access links are for members; this is the only
 * way to change it.
 */
const changePasswordFn = createServerFn({ method: 'POST' })
  .middleware([sessionMiddleware])
  .validator((input: ChangePasswordInput) => input)
  .handler(async ({ data: input, context: { user } }): Promise<ActionResult> => {
    const parsed = changePasswordSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }
    if (!user.isMainAdmin) {
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

    return { data: undefined }
  })

export const changePassword = (input: ChangePasswordInput) => changePasswordFn({ data: input })
