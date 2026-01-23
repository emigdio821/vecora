import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '@/db'
import { auditLogs } from '@/db/schemas/main'
import type { AuditLogWithUser } from '@/db/schemas/zod/audit-logs'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import { createAuditLogSchema } from '@/schemas/audit'

export const createAuditLog = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createAuditLogSchema)
  .handler(async ({ data, context }) => {
    try {
      const request = getRequest()
      const session = context.session

      await db.insert(auditLogs).values({
        userId: session.user.id,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: {
          old: data.oldData ?? null,
          new: data.newData ?? null,
        },
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
        userAgent: request.headers.get('user-agent') ?? null,
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
    }
  })

export const getAuditLogs = createServerFn()
  .middleware([authMiddleware, adminOnlyMiddleware])
  .handler(async () => {
    const auditLogs = await db.query.auditLogs.findMany({
      with: {
        user: true,
      },
      orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
    })

    return auditLogs satisfies AuditLogWithUser[]
  })
