import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getAuthSession } from '@/lib/auth'

/**
 * For every server function that needs a signed-in user. A session that
 * expired (or was signed out elsewhere) answers with a redirect to /login,
 * which src/start.ts turns into a full page load, instead of an RLS error.
 */
export const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const authSession = await getAuthSession()
  if (!authSession) throw redirect({ to: '/login' })

  return next()
})
