import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { profiles } from '..'

export const insertProfileSchema = createInsertSchema(profiles)
export const selectProfileSchema = createSelectSchema(profiles)
export const profileRoleSchema = z.enum([
  'admin',
  'resident',
  'maintenance',
  'president',
  'security',
  'treasurer',
])

export type ProfileRole = z.infer<typeof profileRoleSchema>
export type InsertProfile = z.infer<typeof insertProfileSchema>
export type SelectProfile = z.infer<typeof selectProfileSchema>
