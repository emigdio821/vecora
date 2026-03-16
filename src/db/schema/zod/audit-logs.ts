import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { auditLogActionEnum, auditLogEntityTypeEnum, auditLogs } from '..'

export const insertAuditLogSchema = createInsertSchema(auditLogs)
export const selectAuditLogSchema = createSelectSchema(auditLogs)

export const auditLogActionSchema = z.enum(auditLogActionEnum.enumValues)
export const auditLogEntityTypeSchema = z.enum(auditLogEntityTypeEnum.enumValues)

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>
export type SelectAuditLog = z.infer<typeof selectAuditLogSchema>
export type AuditLogAction = z.infer<typeof auditLogActionSchema>
export type AuditLogEntityType = z.infer<typeof auditLogEntityTypeSchema>
