import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { auditLogs } from '../main'
import type { SelectUser } from './users'

export const insertAuditLogSchema = createInsertSchema(auditLogs)
export const selectAuditLogSchema = createSelectSchema(auditLogs)

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>
export type SelectAuditLog = z.infer<typeof selectAuditLogSchema>

export type AuditLogWithUser = SelectAuditLog & {
  user: SelectUser | null
}
