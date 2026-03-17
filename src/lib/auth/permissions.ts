import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'
import { Action, Resource } from '@/types/rbac'

const statement = {
  ...defaultStatements,
  [Resource.MAINTENANCE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.PRESIDENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.SECURITY]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.TREASURER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
} as const

export const ac = createAccessControl(statement)

// Super Admin role: system-level admin with full access (seeded, cannot be created via UI)
export const superAdminRole = ac.newRole({
  ...adminAc.statements,
  [Resource.MAINTENANCE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.PRESIDENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.SECURITY]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.TREASURER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
})

// Admin role: full access to everything
export const adminRole = ac.newRole({
  ...adminAc.statements,
  [Resource.MAINTENANCE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.PRESIDENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.SECURITY]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.TREASURER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
})

// Resident role: read-only access to all sections
export const residentRole = ac.newRole({
  [Resource.MAINTENANCE]: [Action.READ],
  [Resource.PRESIDENT]: [Action.READ],
  [Resource.SECURITY]: [Action.READ],
  [Resource.TREASURER]: [Action.READ],
})

// Maintenance role: full CRUD in maintenance section, read-only elsewhere
export const maintenanceRole = ac.newRole({
  [Resource.MAINTENANCE]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.PRESIDENT]: [Action.READ],
  [Resource.SECURITY]: [Action.READ],
  [Resource.TREASURER]: [Action.READ],
})

// President role: full CRUD in president section, read-only elsewhere
export const presidentRole = ac.newRole({
  [Resource.PRESIDENT]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.MAINTENANCE]: [Action.READ],
  [Resource.SECURITY]: [Action.READ],
  [Resource.TREASURER]: [Action.READ],
})

// Security role: full CRUD in security section, read-only elsewhere
export const securityRole = ac.newRole({
  [Resource.SECURITY]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.MAINTENANCE]: [Action.READ],
  [Resource.PRESIDENT]: [Action.READ],
  [Resource.TREASURER]: [Action.READ],
})

// Treasurer role: full CRUD in treasurer section, read-only elsewhere
export const treasurerRole = ac.newRole({
  [Resource.TREASURER]: [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE],
  [Resource.MAINTENANCE]: [Action.READ],
  [Resource.PRESIDENT]: [Action.READ],
  [Resource.SECURITY]: [Action.READ],
})
