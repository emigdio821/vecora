import { z } from 'zod'

export const createAuditLogSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  entityType: z.string().min(1).max(50),
  entityId: z.string().nullable(),
  oldData: z.unknown().optional(),
  newData: z.unknown().optional(),
})
