import { createServerFn } from '@tanstack/react-start'
import { getCurrentUser } from '@/lib/auth/current-user'
import { boardMiddleware } from '@/lib/auth/middleware'
import { getSettings } from '@/lib/db/settings'

/**
 * Reads for the route guards and the authed layout; see tanstack-queries/session.ts.
 * No middleware on the user: signed out is an answer (null) the guards act on.
 */
export const fetchCurrentUser = createServerFn().handler(() => getCurrentUser())

export const fetchSettings = createServerFn()
  .middleware([boardMiddleware])
  .handler(() => getSettings())
