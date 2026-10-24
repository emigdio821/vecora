import { createAuthClient } from 'better-auth/client'
import type { LoginInput } from '@/lib/validations/auth'
import { m } from '@/paraglide/messages'
import type { Locale } from '@/paraglide/runtime'
import { afterSignIn } from '@/server-actions/auth'

/**
 * Better Auth in the browser, for the endpoints src/routes/api/auth/$.ts lets
 * through: signing in with a password and signing out. Same origin, so no
 * base URL. The signed-in user is read through fetchCurrentUser, not here.
 */
export const authClient = createAuthClient()

/** The code src/lib/auth/index.ts answers with for an account that holds no role. */
const NOT_ON_THE_BOARD = 'NOT_ON_THE_BOARD'

const TOO_MANY_REQUESTS = 429

/**
 * `locale`: the device had no language picked, so it now starts in the HOA's.
 * If it differs from the page's, the caller reloads instead of navigating.
 */
export type SignInResult = { error: string } | { locale: Locale | undefined }

export async function signInWithPassword(input: LoginInput): Promise<SignInResult> {
  const { error } = await authClient.signIn.email(input)
  if (error) {
    // Only board members may use the app. Someone taken off the board keeps
    // their account, for history, but is turned away here.
    if (error.code === NOT_ON_THE_BOARD) {
      return { error: m.auth_no_access_message() }
    }
    if (error.status === TOO_MANY_REQUESTS) {
      return { error: m.auth_too_many_attempts() }
    }
    return { error: m.auth_credentials_invalid() }
  }

  return afterSignIn()
}

/** Navigation is left to the caller, so it can clear the query cache first. */
export async function signOut(): Promise<{ error?: string }> {
  const { error } = await authClient.signOut()
  if (error) {
    return { error: m.auth_logout_failed() }
  }
  return {}
}
