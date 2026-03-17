import { Action, Resource, Role } from '@/types/rbac'
import type { SessionUser } from '.'

type PermissionMap = Record<Resource, readonly Action[]>

const allActions = [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE] as const
const readOnly = [Action.READ] as const

/** Builds a `PermissionMap` by calling `fn` for every `Resource` value. */
function buildPermissionMap(fn: (r: Resource) => readonly Action[]): PermissionMap {
  const map = {} as Record<Resource, readonly Action[]>
  for (const r of Object.values(Resource)) {
    map[r] = fn(r)
  }
  return map
}

const readOnlyAll = buildPermissionMap(() => readOnly)

const rolePermissions: Record<Role, PermissionMap | Role.ADMIN> = {
  [Role.ADMIN]: Role.ADMIN,
  [Role.RESIDENT]: readOnlyAll,
  [Role.MAINTENANCE]: buildPermissionMap((r) => (r === Resource.MAINTENANCE ? allActions : readOnly)),
  [Role.PRESIDENT]: buildPermissionMap((r) => (r === Resource.PRESIDENT ? allActions : readOnly)),
  [Role.SECURITY]: buildPermissionMap((r) => (r === Resource.SECURITY ? allActions : readOnly)),
  [Role.TREASURER]: buildPermissionMap((r) => (r === Resource.TREASURER ? allActions : readOnly)),
}

type UserLike = Pick<SessionUser, 'role'> | undefined | null

/** Checks whether the user has the given role (or one of the given roles). */
export function hasRole(user: UserLike, role: Role | Role[]): boolean {
  if (!user?.role) return false
  return Array.isArray(role) ? role.includes(user.role as Role) : user.role === role
}

/** Returns `true` if the user has the `ADMIN` role. */
export function isAdmin(user: UserLike): boolean {
  return hasRole(user, Role.ADMIN)
}

/** Checks whether the user is allowed to perform `action` on `resource`. Admins always pass. */
export function can(user: UserLike, action: Action, resource: Resource): boolean {
  if (!user?.role) return false
  if (isAdmin(user)) return true

  const perms = rolePermissions[user.role as Role]
  if (!perms || perms === Role.ADMIN) return false

  return perms[resource]?.includes(action) ?? false
}

/** Returns `true` if the user can perform **at least one** of the given actions on the resource. */
export function canAny(user: UserLike, actions: Action[], resource: Resource): boolean {
  return actions.some((action) => can(user, action, resource))
}

/** Returns `true` if the user can perform **all** of the given actions on the resource. */
export function canAll(user: UserLike, actions: Action[], resource: Resource): boolean {
  return actions.every((action) => can(user, action, resource))
}

/** Throws an error if the user does not have the required role. */
export function requireRole(
  user: UserLike,
  role: Role | Role[],
  errorMessage = 'Insufficient permissions',
): void {
  if (!hasRole(user, role)) {
    throw new Error(errorMessage)
  }
}

/** Throws an error if the user is not allowed to perform `action` on `resource`. */
export function requirePermission(
  user: UserLike,
  action: Action,
  resource: Resource,
  errorMessage = 'Insufficient permissions',
): void {
  if (!can(user, action, resource)) {
    throw new Error(errorMessage)
  }
}

/** Returns a convenience object with the user's role and shorthand permission-check helpers. */
export function getUserPermissions(user: UserLike) {
  const userRole = (user?.role as Role) ?? null

  return {
    role: userRole,
    canCreate: (resource: Resource) => can(user, Action.CREATE, resource),
    canRead: (resource: Resource) => can(user, Action.READ, resource),
    canUpdate: (resource: Resource) => can(user, Action.UPDATE, resource),
    canDelete: (resource: Resource) => can(user, Action.DELETE, resource),
  }
}
