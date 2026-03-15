import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { profileRoles, roles } from '..'

export const insertRoleSchema = createInsertSchema(roles)
export const selectRoleSchema = createSelectSchema(roles)

export const insertProfileRoleSchema = createInsertSchema(profileRoles)
export const selectProfileRoleSchema = createSelectSchema(profileRoles)

export type InsertRole = z.infer<typeof insertRoleSchema>
export type SelectRole = z.infer<typeof selectRoleSchema>
export type InsertProfileRole = z.infer<typeof insertProfileRoleSchema>
export type SelectProfileRole = z.infer<typeof selectProfileRoleSchema>
export type ProfileRoleWithRole = SelectProfileRole & {
  role: SelectRole
}
