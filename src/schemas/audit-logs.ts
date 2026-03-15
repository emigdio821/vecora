import { z } from 'zod'
import { auditLogActionEnum, auditLogEntityTypeEnum } from '@/db/schema'

export const createAuditLogSchema = z.object({
  action: z.enum(auditLogActionEnum.enumValues),
  entityType: z.enum(auditLogEntityTypeEnum.enumValues),
  entityId: z.string().optional(),
  entityUserId: z.string().optional(),
  oldData: z.unknown().optional(),
  newData: z.unknown().optional(),
})
