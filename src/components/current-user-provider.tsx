import { createContext, useContext } from 'react'
import type { CurrentUser } from '@/lib/auth/current-user'
import { can, type Permissions } from '@/lib/auth/permissions'

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
 * Whether the user's roles grant `permissions` (src/lib/auth/permissions.ts).
 * This only decides what to *show*: the server function asks the same
 * question before every write.
 */
export function useCan(permissions: Permissions): boolean {
  const { roles } = useCurrentUser()
  return can(roles, permissions)
}
