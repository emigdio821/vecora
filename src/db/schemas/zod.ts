import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { externalUsers, owners, profiles, roles, userRoles } from './main'

// Profile schemas
export const insertProfileSchema = createInsertSchema(profiles)
export const selectProfileSchema = createSelectSchema(profiles)

// Owner schemas
export const insertOwnerSchema = createInsertSchema(owners)
export const selectOwnerSchema = createSelectSchema(owners)

// External user schemas
export const insertExternalUserSchema = createInsertSchema(externalUsers)
export const selectExternalUserSchema = createSelectSchema(externalUsers)

// Role schemas
export const insertRoleSchema = createInsertSchema(roles)
export const selectRoleSchema = createSelectSchema(roles)

// User role schemas
export const insertUserRoleSchema = createInsertSchema(userRoles)
export const selectUserRoleSchema = createSelectSchema(userRoles)

// Custom schema for profile API response
export const profileResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  profileType: z.enum(['owner', 'external']),
  ownerId: z.string().nullable(),
  externalUserId: z.string().nullable(),
  roles: z.array(z.string()),
  image: z.string().nullable(),
})

// Export types
export type InsertProfile = z.infer<typeof insertProfileSchema>
export type SelectProfile = z.infer<typeof selectProfileSchema>
export type InsertOwner = z.infer<typeof insertOwnerSchema>
export type SelectOwner = z.infer<typeof selectOwnerSchema>
export type InsertExternalUser = z.infer<typeof insertExternalUserSchema>
export type SelectExternalUser = z.infer<typeof selectExternalUserSchema>
export type InsertRole = z.infer<typeof insertRoleSchema>
export type SelectRole = z.infer<typeof selectRoleSchema>
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>
export type SelectUserRole = z.infer<typeof selectUserRoleSchema>
export type ProfileResponse = z.infer<typeof profileResponseSchema>
