import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { user } from './auth'
import { externalUsers, houses, owners, payments, profiles, roles, userRoles, violations } from './main'

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

// Houses schemas
export const insertHouseSchema = createInsertSchema(houses)
export const selectHouseSchema = createSelectSchema(houses)

// Violations schemas
export const insertViolationSchema = createInsertSchema(violations)
export const selectViolationSchema = createSelectSchema(violations)

// Payments schemas
export const insertPaymentSchema = createInsertSchema(payments)
export const selectPaymentSchema = createSelectSchema(payments)

// User schemas
export const selectUserSchema = createSelectSchema(user)

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
export type InsertHouse = z.infer<typeof insertHouseSchema>
export type SelectHouse = z.infer<typeof selectHouseSchema>
export type InsertViolation = z.infer<typeof insertViolationSchema>
export type SelectViolation = z.infer<typeof selectViolationSchema>
export type InsertPayment = z.infer<typeof insertPaymentSchema>
export type SelectPayment = z.infer<typeof selectPaymentSchema>
export type SelectUser = z.infer<typeof selectUserSchema>

// Type for owners with all relations included
export type OwnerWithRelations = SelectOwner & {
  houses: SelectHouse[]
  violations: SelectViolation[]
  payments: SelectPayment[]
  profile:
    | (SelectProfile & {
        user: SelectUser
      })
    | null
}

// Type for houses with owner relation included
export type HouseWithOwner = SelectHouse & {
  owner: SelectOwner | null
}
