import { createServerFn } from '@tanstack/react-start'
import { getCurrentUser } from '@/lib/supabase/current-user'
import { getSettings } from '@/lib/supabase/settings'

/** Reads for the route guards and the authed layout; see tanstack-queries/session.ts. */
export const fetchCurrentUser = createServerFn().handler(() => getCurrentUser())

export const fetchSettings = createServerFn().handler(() => getSettings())
