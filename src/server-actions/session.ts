import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/lib/supabase/auth-middleware'
import { getCurrentUser } from '@/lib/supabase/current-user'
import { getSettings } from '@/lib/supabase/settings'

/**
 * Reads for the route guards and the authed layout; see tanstack-queries/session.ts.
 * No auth middleware on the user: signed out is an answer (null) the guards act on.
 */
export const fetchCurrentUser = createServerFn().handler(() => getCurrentUser())

export const fetchSettings = createServerFn()
  .middleware([authMiddleware])
  .handler(() => getSettings())
