import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { auditLogs, profiles } from '@/db/schemas/main'
import type { AuditLogWithUserAndProfile } from '@/db/schemas/zod/audit-logs'
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
    const logs = await db.query.auditLogs.findMany({
      with: {
        user: true,
        profile: {
          with: {
            profileRoles: {
              with: {
                role: true,
              },
            },
          },
        },
      },
      orderBy: (auditLogs, { desc }) => [desc(auditLogs.timestamp)],
    })

    // Transform the data to match AuditLogWithProfile type
    const transformedLogs = logs.map((log) => ({
      ...log,
      profile: log.profile
        ? {
            userId: log.profile.userId,
            email: log.user?.email ?? '',
            firstName: log.user?.name?.split(' ')[0] ?? '',
            lastName: log.user?.name?.split(' ').slice(1).join(' ') ?? '',
            profileType: log.profile.profileType,
            ownerId: log.profile.ownerId,
            externalUserId: log.profile.externalUserId,
            roles: log.profile.profileRoles.map((pr) => pr.role.name),
            image: log.user?.image ?? null,
          }
        : null,
    }))

    return transformedLogs satisfies AuditLogWithUserAndProfile[]
  })
