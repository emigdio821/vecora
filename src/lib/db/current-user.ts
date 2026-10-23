import '@tanstack/react-start/server-only'
import { redirect } from '@tanstack/react-router'
import { type Transaction, withUser } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'

/**
 * Id of the signed-in user, or null. Sign-in is still Supabase's while the
 * sections move to Neon: the accounts have the same ids in both, so its
 * session says who is acting on Neon too. This is the one place that changes
 * when Better Auth takes over.
 */
export async function getSessionUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) {
    return null
  }
  return data.claims.sub
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
