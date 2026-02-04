import type { ProfileRoleWithRole } from '@/db/schemas/zod/profile-roles'

export type RoleName = 'admin' | 'user' | string

export function hasRole(profileRoles: ProfileRoleWithRole[] | undefined, roleName: RoleName): boolean {
  if (!profileRoles || profileRoles.length === 0) {
    return false
  }

  return profileRoles.some((pr) => pr.role.name === roleName)
}

export function isAdmin(profileRoles: ProfileRoleWithRole[] | undefined): boolean {
  return hasRole(profileRoles, 'admin')
}

export function hasAnyRole(profileRoles: ProfileRoleWithRole[] | undefined, roleNames: RoleName[]): boolean {
  if (!profileRoles || profileRoles.length === 0 || roleNames.length === 0) {
    return false
  }

  return profileRoles.some((pr) => roleNames.includes(pr.role.name))
}

export function hasAllRoles(profileRoles: ProfileRoleWithRole[] | undefined, roleNames: RoleName[]): boolean {
  if (!profileRoles || profileRoles.length === 0 || roleNames.length === 0) {
    return false
  }

  return roleNames.every((roleName) => profileRoles.some((pr) => pr.role.name === roleName))
}

export function getRoleNames(profileRoles: ProfileRoleWithRole[] | undefined): string[] {
  if (!profileRoles || profileRoles.length === 0) {
    return []
  }

  return profileRoles.map((pr) => pr.role.name)
}
