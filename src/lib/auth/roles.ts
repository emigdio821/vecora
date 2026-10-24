// The board's roles. A person may hold several; Better Auth's admin plugin
// keeps them in users.role, comma-separated. No imports: the database schema
// (users_role_valid) and the seed read this list too.

export const APP_ROLES = ['admin', 'president', 'treasurer', 'security', 'maintenance'] as const

export type AppRole = (typeof APP_ROLES)[number]

function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value)
}

/** users.role as a list. Null or empty: not on the board. */
export function parseRoles(role: string | null | undefined): AppRole[] {
  if (!role) {
    return []
  }
  return role.split(',').filter(isAppRole)
}

/** A list of roles as users.role stores it, in APP_ROLES order. */
export function formatRoles(roles: readonly AppRole[]): string {
  return APP_ROLES.filter((role) => roles.includes(role)).join(',')
}
