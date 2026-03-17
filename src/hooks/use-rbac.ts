import { useRouteContext } from '@tanstack/react-router'
import { useMemo } from 'react'
import { can, canAll, canAny, getUserPermissions, hasRole, isAdmin, isSuperAdmin } from '@/lib/auth/rbac'
import type { Action, Resource, Role } from '@/types/rbac'

export function useRBAC() {
  const { profile } = useRouteContext({ from: '/_authed' })
  const user = profile?.user

  return useMemo(
    () => ({
      user,
      isAdmin: () => isAdmin(user),
      isSuperAdmin: () => isSuperAdmin(user),
      permissions: getUserPermissions(user),
      hasRole: (role: Role | Role[]) => hasRole(user, role),
      can: (action: Action, resource: Resource) => can(user, action, resource),
      canAny: (actions: Action[], resource: Resource) => canAny(user, actions, resource),
      canAll: (actions: Action[], resource: Resource) => canAll(user, actions, resource),
    }),
    [user],
  )
}

export function useHasRole(role: Role | Role[]): boolean {
  const { hasRole } = useRBAC()
  return hasRole(role)
}

export function useIsAdmin(): boolean {
  const { isAdmin } = useRBAC()
  return isAdmin()
}

export function useIsSuperAdmin(): boolean {
  const { isSuperAdmin } = useRBAC()
  return isSuperAdmin()
}

export function useCan(action: Action, resource: Resource): boolean {
  const { can } = useRBAC()
  return can(action, resource)
}
