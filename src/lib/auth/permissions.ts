import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'

const statement = {
  ...defaultStatements,
  maintenance: ['create', 'read', 'update', 'delete'],
  president: ['create', 'read', 'update', 'delete'],
  security: ['create', 'read', 'update', 'delete'],
  treasurer: ['create', 'read', 'update', 'delete'],
} as const

export const ac = createAccessControl(statement)

// Admin role: full access to everything
export const adminRole = ac.newRole({
  ...adminAc.statements,
  maintenance: ['create', 'read', 'update', 'delete'],
  president: ['create', 'read', 'update', 'delete'],
  security: ['create', 'read', 'update', 'delete'],
  treasurer: ['create', 'read', 'update', 'delete'],
})

// Maintenance role: full CRUD in maintenance section, read-only elsewhere
export const maintenanceRole = ac.newRole({
  maintenance: ['create', 'read', 'update', 'delete'],
  president: ['read'],
  security: ['read'],
  treasurer: ['read'],
})

// President role: full CRUD in president section, read-only elsewhere
export const presidentRole = ac.newRole({
  president: ['create', 'read', 'update', 'delete'],
  maintenance: ['read'],
  security: ['read'],
  treasurer: ['read'],
})

// Security role: full CRUD in security section, read-only elsewhere
export const securityRole = ac.newRole({
  security: ['create', 'read', 'update', 'delete'],
  maintenance: ['read'],
  president: ['read'],
  treasurer: ['read'],
})

// Treasurer role: full CRUD in treasurer section, read-only elsewhere
export const treasurerRole = ac.newRole({
  treasurer: ['create', 'read', 'update', 'delete'],
  maintenance: ['read'],
  president: ['read'],
  security: ['read'],
})
