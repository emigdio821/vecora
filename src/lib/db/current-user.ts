import '@tanstack/react-start/server-only'
import { redirect } from '@tanstack/react-router'
import { getAuthSession } from '@/lib/auth'
import { type Transaction, withUser } from '@/lib/db'

/** Id of the signed-in user (Better Auth's session), or null. */
export async function getSessionUserId(): Promise<string | null> {
  const authSession = await getAuthSession()
  if (!authSession) {
    return null
  }
  return authSession.user.id
}

/**
 * Runs `run` as the signed-in user (see withUser), for server functions and
 * routes. Signed out, it redirects to /login like authMiddleware.
 */
export async function withCurrentUser<T>(run: (tx: Transaction) => Promise<T>): Promise<T> {
  const userId = await getSessionUserId()
  if (!userId) {
    throw redirect({ to: '/login' })
  }
  return withUser(userId, run)
}
