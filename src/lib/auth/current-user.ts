import '@tanstack/react-start/server-only'
import { type AuthSession, getAuthSession } from '@/lib/auth'
import { m } from '@/paraglide/messages'
import { type AppRole, parseRoles } from './roles'

export type { AppRole }

export interface CurrentUser {
  id: string
  email: string
  name: string
  roles: AppRole[]
  /**
   * The session came from an access link (invite or password reset) and no
   * password has been typed since. Such sessions are only allowed on
   * /set-password; setPassword() swaps them for a normal one.
   */
  mustSetPassword: boolean
  /**
   * Still on the default password the seed gives it (the main admin). Sent
   * to /set-password like an access link, until the password changes.
   */
  mustChangePassword: boolean
  /** Already closed the welcome dialog, on any device. */
  welcomed: boolean
  /** admin@vecora.app, the app's own account. */
  isMainAdmin: boolean
}

/** The CurrentUser of a Better Auth session: it already carries the user's row. */
export function toCurrentUser({ user, session }: AuthSession): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email.split('@')[0] || m.common_user_fallback_name(),
    roles: parseRoles(user.role),
    mustSetPassword: session.fromAccessLink === true,
    mustChangePassword: user.mustChangePassword === true,
    welcomed: user.welcomedAt !== null && user.welcomedAt !== undefined,
    isMainAdmin: user.isMainAdmin === true,
  }
}

/**
 * Current signed-in user, for server code. Routes read it through
 * fetchCurrentUser and the ['user'] query. Returns null when signed out.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const authSession = await getAuthSession()
  if (!authSession) {
    return null
  }
  return toCurrentUser(authSession)
}
