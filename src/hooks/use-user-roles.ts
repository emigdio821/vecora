import { useQuery } from '@tanstack/react-query'
import { userProfileQueryOptions } from '@/api/tanstack-queries/user'
import type { RoleName } from '@/lib/rbac'
import { getRoleNames, hasAnyRole, hasRole, isAdmin } from '@/lib/rbac'

export function useUserRoles() {
  const { data: profile, ...rest } = useQuery(userProfileQueryOptions())
  const profileRoles = profile?.profileRoles

  return {
    profile,
    profileRoles,
    isAdmin: isAdmin(profileRoles),
    roles: getRoleNames(profileRoles),
    hasRole: (roleName: RoleName) => hasRole(profileRoles, roleName),
    hasAnyRole: (roleNames: RoleName[]) => hasAnyRole(profileRoles, roleNames),
    ...rest,
  }
}
