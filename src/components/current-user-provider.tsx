'use client'

import { createContext, useContext } from 'react'
import type { AppRole, CurrentUser } from '@/lib/supabase/current-user'

const CurrentUserContext = createContext<CurrentUser | null>(null)

/** Makes the signed-in user (from the authed layout) available to client components. */
export function CurrentUserProvider({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>
}

export function useCurrentUser(): CurrentUser {
  const user = useContext(CurrentUserContext)
  if (!user) throw new Error('useCurrentUser must be used inside the authed layout')
  return user
}

/**
 * Whether the user holds any of the given roles. Admin always qualifies, like
 * `private.has_role` in the database. This only decides what to *show*: RLS
 * still enforces every write on the server.
 */
export function useHasRole(...roles: AppRole[]): boolean {
  const { roles: userRoles } = useCurrentUser()
  return userRoles.includes('admin') || roles.some((role) => userRoles.includes(role))
}
