// What each board role may do, with Better Auth's access control. Every
// server function that writes declares what it needs (requirePermission in
// src/lib/auth/middleware.ts); the screens ask the same question to show or
// hide a button (can()).
//
// Every board member reads every section; these are the writes. The rules
// inside a section that depend on the data (only an admin hands out the
// admin role, a template's author or an admin renames it...) are checked by
// the section's service, which has the rows.
//
// The admin plugin's own statements (user, session) are left out on purpose:
// its endpoints aren't mounted (src/routes/api/auth/$.ts), and no role gets
// them should they ever be.
import { createAccessControl } from 'better-auth/plugins/access'
import type { AppRole } from './roles'

export const statement = {
  /** Houses and residents. */
  registry: ['write'],
  /** Seat and remove board members, change their roles, hand out access links. */
  board: ['manage'],
  /** Fiscal periods and their fee rules. */
  period: ['write'],
  /** Common areas. */
  amenity: ['write'],
  /** Book, edit and delete unpaid bookings; collect: record the fee, cancel a paid one. */
  reservation: ['write', 'collect'],
  transaction: ['write'],
  category: ['write'],
  /** write: the section's own pending requests; resolve: pay, reject or reopen them. */
  maintenanceRequest: ['write', 'resolve'],
  securityRequest: ['write', 'resolve'],
  /** write: name and logo; configure: language and currency. */
  settings: ['write', 'configure'],
  /** write: save templates and manage one's own; manage: anyone's. */
  document: ['write', 'manage'],
  /** The activity log. */
  log: ['read'],
} as const

export const ac = createAccessControl(statement)

const president = ac.newRole({
  registry: ['write'],
  board: ['manage'],
  period: ['write'],
  amenity: ['write'],
  reservation: ['write'],
  settings: ['write'],
  document: ['write'],
})

// Creating the next period is part of closing the books, so the treasurer
// writes periods too.
const treasurer = ac.newRole({
  period: ['write'],
  reservation: ['write', 'collect'],
  transaction: ['write'],
  category: ['write'],
  maintenanceRequest: ['resolve'],
  securityRequest: ['resolve'],
  document: ['write'],
})

const security = ac.newRole({
  securityRequest: ['write'],
  document: ['write'],
})

const maintenance = ac.newRole({
  maintenanceRequest: ['write'],
  document: ['write'],
})

const admin = ac.newRole({
  registry: ['write'],
  board: ['manage'],
  period: ['write'],
  amenity: ['write'],
  reservation: ['write', 'collect'],
  transaction: ['write'],
  category: ['write'],
  maintenanceRequest: ['write', 'resolve'],
  securityRequest: ['write', 'resolve'],
  settings: ['write', 'configure'],
  document: ['write', 'manage'],
  log: ['read'],
})

export const roles = { admin, president, treasurer, security, maintenance } satisfies Record<AppRole, unknown>

/** What a server function asks for: `{ transaction: ['write'] }`. */
export type Permissions = {
  [Resource in keyof typeof statement]?: Array<(typeof statement)[Resource][number]>
}

/** Whether any of `userRoles` grants every permission asked for. */
export function can(userRoles: readonly AppRole[], permissions: Permissions): boolean {
  return userRoles.some((role) => roles[role].authorize(permissions).success)
}
