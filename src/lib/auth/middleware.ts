import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getAuthSession } from '@/lib/auth'
import { m } from '@/paraglide/messages'
import { toCurrentUser } from './current-user'
import { can, type Permissions } from './permissions'

/*
 * Who may call a server function, in three steps. Each puts the signed-in
 * user in the handler's context (context.user), so no handler reads the
 * session again:
 *
 *   sessionMiddleware        signed in (the set-password and welcome steps)
 *   boardMiddleware          ...a board member past those steps: every read
 *   requirePermission(...)   ...whose roles allow this write (./permissions.ts)
 */

/**
 * A signed-in user. A session that expired (or was signed out elsewhere)
 * answers with a redirect to /login, which src/start.ts turns into a full
 * page load.
 */
export const sessionMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const authSession = await getAuthSession()
  if (!authSession) {
    throw redirect({ href: '/login' })
  }

  return next({ context: { user: toCurrentUser(authSession) } })
})

/**
 * A board member with a password of their own. An access link's session, or
 * the main admin's default password, only gets as far as /set-password.
 */
export const boardMiddleware = createMiddleware({ type: 'function' })
  .middleware([sessionMiddleware])
  .server(async ({ next, context }) => {
    const { user } = context
    // Taking someone off the board ends their sessions (src/lib/services/board.ts),
    // and a sign-in needs a role, so this only answers a race.
    if (user.roles.length === 0) {
      throw new Error(m.common_no_permission())
    }
    if (user.mustSetPassword || user.mustChangePassword) {
      throw redirect({ href: '/set-password' })
    }

    return next()
  })

/** A board member whose roles grant `permissions`, for the server functions that write. */
export function requirePermission(permissions: Permissions) {
  return createMiddleware({ type: 'function' })
    .middleware([boardMiddleware])
    .server(async ({ next, context }) => {
      if (!can(context.user.roles, permissions)) {
        throw new Error(m.common_no_permission())
      }

      return next()
    })
}
