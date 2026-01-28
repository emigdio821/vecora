import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { profiles } from '../main'
import type { ProfileRoleWithRole } from './profile-roles'
import type { SelectUser } from './users'

export const insertProfileSchema = createInsertSchema(profiles)
export const selectProfileSchema = createSelectSchema(profiles)

export type InsertProfile = z.infer<typeof insertProfileSchema>
export type SelectProfile = z.infer<typeof selectProfileSchema>
export type ProfileWithUser = z.infer<typeof selectProfileSchema> & {
  user: SelectUser
}
export type ProfileWithRoles = SelectProfile & {
  profileRoles: ProfileRoleWithRole[]
}
export type ProfileWithUserAndRoles = SelectProfile & {
  user: SelectUser
  profileRoles: ProfileRoleWithRole[]
}
