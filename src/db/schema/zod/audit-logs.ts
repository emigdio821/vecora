import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { auditLogActionEnum, auditLogEntityTypeEnum, auditLogs } from '..'
import type { ProfileWithRoles } from './profiles'
import type { SelectUser } from './users'

export const insertAuditLogSchema = createInsertSchema(auditLogs)
export const selectAuditLogSchema = createSelectSchema(auditLogs)

export const auditLogActionSchema = z.enum(auditLogActionEnum.enumValues)
export const auditLogEntityTypeSchema = z.enum(auditLogEntityTypeEnum.enumValues)

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>
export type SelectAuditLog = z.infer<typeof selectAuditLogSchema>
export type AuditLogAction = z.infer<typeof auditLogActionSchema>
export type AuditLogEntityType = z.infer<typeof auditLogEntityTypeSchema>

export type AuditLogWithUser = SelectAuditLog & {
  user: SelectUser | null
}

export type AuditLogWithUserAndProfile = SelectAuditLog & {
  user: SelectUser | null
  profile: ProfileWithRoles | null
  entityUser: SelectUser | null
}
