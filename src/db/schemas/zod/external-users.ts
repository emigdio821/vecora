import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { externalUsers } from '../main'

export const insertExternalUserSchema = createInsertSchema(externalUsers)
export const selectExternalUserSchema = createSelectSchema(externalUsers)

export type InsertExternalUser = z.infer<typeof insertExternalUserSchema>
export type SelectExternalUser = z.infer<typeof selectExternalUserSchema>
