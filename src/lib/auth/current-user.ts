import '@tanstack/react-start/server-only'
import { getAuthSession } from '@/lib/auth'
import { withUser } from '@/lib/db'
import type { AppRole } from '@/lib/validations/hoa-board'
import { m } from '@/paraglide/messages'

export type { AppRole }

export interface CurrentUser {
  id: string
  email: string
  fullName: string
  roles: AppRole[]
  /**
   * The session came from an access link (invite or password reset) and no
   * password has been typed since. Such sessions are only allowed on
   * /set-password; setPassword() swaps them for a normal one.
   */
  mustSetPassword: boolean
  /**
   * Still on the default password the cutover gives it (the main admin).
   * Sent to /set-password like an access link, until the password changes.
   */
  mustChangePassword: boolean
  /** Already closed the welcome dialog, on any device. */
  welcomed: boolean
  /** admin@vecora.app, the app's own account. */
  isMainAdmin: boolean
}

/**
 * Current signed-in user with profile and roles, for server code. Routes read
 * it through fetchCurrentUser and the ['user'] query, so a request makes one
 * round trip. Returns null when signed out.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const authSession = await getAuthSession()
  if (!authSession) return null

  const { user, session } = authSession

  // Not caught: "no roles" would send a board member to /no-access, and the
  // guards keep the user cached until the next sign-in. The error page retries.
  const profile = await withUser(user.id, (tx) =>
    tx.query.profiles.findFirst({
      columns: { fullName: true, email: true, welcomedAt: true, isMainAdmin: true, mustChangePassword: true },
      with: { userRolesUserId: { columns: { role: true } } },
      where: { id: user.id },
    }),
  )

  return {
    id: user.id,
    email: profile?.email ?? user.email,
    fullName: profile?.fullName || user.email.split('@')[0] || m.common_user_fallback_name(),
    roles: profile?.userRolesUserId.map((row) => row.role) ?? [],
    mustSetPassword: !!session.fromAccessLink,
    mustChangePassword: !!profile?.mustChangePassword,
    welcomed: !!profile?.welcomedAt,
    isMainAdmin: !!profile?.isMainAdmin,
  }
}
