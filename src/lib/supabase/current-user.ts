import { cache } from 'react'
import type { Database } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

export type AppRole = Database['public']['Enums']['app_role']

export interface CurrentUser {
  id: string
  email: string
  fullName: string
  roles: AppRole[]
}

/**
 * Current signed-in user with profile and roles, for server components.
 * Wrapped in React `cache` so the layout and pages in the same request
 * share one round trip. Returns null when signed out.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data) return null

  const { sub: id, email } = data.claims

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, user_roles!user_id ( role )')
    .eq('id', id)
    .maybeSingle()

  return {
    id,
    email: email ?? '',
    fullName: profile?.full_name || email?.split('@')[0] || 'Usuario',
    roles: profile?.user_roles.map((r) => r.role) ?? [],
  }
})
