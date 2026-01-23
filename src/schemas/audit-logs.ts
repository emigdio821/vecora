import { z } from 'zod'
import { auditLogActionEnum, auditLogEntityTypeEnum } from '@/db/schemas/main'

export const createAuditLogSchema = z.object({
  action: z.enum(auditLogActionEnum.enumValues),
  entityType: z.enum(auditLogEntityTypeEnum.enumValues),
  entityId: z.string().nullable(),
  oldData: z.unknown().optional(),
  newData: z.unknown().optional(),
})
