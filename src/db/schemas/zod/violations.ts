import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { violationStatusEnum, violations } from '../main'
import type { SelectOwner } from './owners'

export const insertViolationSchema = createInsertSchema(violations)
export const selectViolationSchema = createSelectSchema(violations)

export const violationStatusSchema = z.enum(violationStatusEnum.enumValues)

export type InsertViolation = z.infer<typeof insertViolationSchema>
export type SelectViolation = z.infer<typeof selectViolationSchema>
export type ViolationStatus = z.infer<typeof violationStatusSchema>

// Type for violations with owner relation included
export type ViolationWithOwner = SelectViolation & {
  owner: SelectOwner | null
}
