import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { profiles, profileTypeEnum } from '../main'
import type { SelectExternalUser } from './external-users'
import type { SelectHoaBoard } from './hoa-board'
import type { SelectOwner } from './owners'
import type { ProfileRoleWithRole } from './profile-roles'
import type { SelectUser } from './users'

export const insertProfileSchema = createInsertSchema(profiles)
export const selectProfileSchema = createSelectSchema(profiles)
export const profileTypeSchema = z.enum(profileTypeEnum.enumValues)

export type ProfileType = z.infer<typeof profileTypeSchema>
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
export type ProfileWithAllRelations = SelectProfile & {
  owner: SelectOwner | null
  externalUser: SelectExternalUser | null
  profileRoles: ProfileRoleWithRole[]
  user: SelectUser | null
  hoaBoardMemberships: SelectHoaBoard[]
}
