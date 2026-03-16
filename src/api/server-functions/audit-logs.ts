import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { auditLogs, profiles } from '@/db/schema'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import { createAuditLogSchema } from '@/schemas/audit-logs'

export const createAuditLog = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createAuditLogSchema)
  .handler(async ({ data, context }) => {
    try {
      const request = getRequest()
      const session = context.session

      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, session.user.id),
      })

      await db.insert(auditLogs).values({
        userId: session.user.id,
        profileId: profile?.id ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        entityUserId: data.entityUserId ?? null,
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
    const logs = await db.query.auditLogs.findMany({
      with: {
        user: true,
        profile: true,
        entityUser: true,
      },
      orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
    })

    return logs
  })
