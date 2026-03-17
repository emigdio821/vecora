import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { profiles } from '..'

export const insertProfileSchema = createInsertSchema(profiles)
export const selectProfileSchema = createSelectSchema(profiles)

export type InsertProfile = z.infer<typeof insertProfileSchema>
export type SelectProfile = z.infer<typeof selectProfileSchema>
