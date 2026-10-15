import '@tanstack/react-start/server-only'
import type { Database } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'
import { m } from '@/paraglide/messages'

export type AppRole = Database['public']['Enums']['app_role']

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
  /** Already closed the welcome dialog, on any device. */
  welcomed: boolean
  /** admin@vecora.com, the app's own account. */
  isMainAdmin: boolean
}

/**
 * The JWT lists how the session was authenticated: `otp` for a link, `password`
 * for the login form. Setting a password doesn't rewrite it, so the flag only
 * clears once the user signs in again (which setPassword does for them).
 */
function cameFromAccessLink(amr: Array<{ method: string } | string> | undefined): boolean {
  const methods = (amr ?? []).map((entry) => (typeof entry === 'string' ? entry : entry.method))
  return methods.includes('otp') && !methods.includes('password')
}

/**
 * Current signed-in user with profile and roles, for server code. Routes read
 * it through fetchCurrentUser and the ['user'] query, so a request makes one
 * round trip. Returns null when signed out.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) return null

  const { sub: id, email, amr } = data.claims

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, welcomed_at, is_main_admin, user_roles!user_id ( role )')
    .eq('id', id)
    .maybeSingle()

  // Not "no roles": that would send a board member to /no-access, and the
  // guards keep the user cached until the next sign-in. The error page retries.
  if (error) throw error

  return {
    id,
    email: email ?? '',
    fullName: profile?.full_name || email?.split('@')[0] || m.common_user_fallback_name(),
    roles: profile?.user_roles.map((r) => r.role) ?? [],
    mustSetPassword: cameFromAccessLink(amr),
    welcomed: !!profile?.welcomed_at,
    isMainAdmin: !!profile?.is_main_admin,
  }
}
