import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { externalUsers } from '@/db/schemas/main'
import type { ExternalUserWithProfileAndUser, SelectExternalUser } from '@/db/schemas/zod/external-users'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import {
  createExternalUserSchema,
  deleteExternalUserSchema,
  updateExternalUserSchema,
} from '@/schemas/external-users'

export const getExternalUsers = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const externalUsersData = await db.query.externalUsers.findMany({
      with: {
        profile: {
          with: {
            user: true,
            profileRoles: {
              with: {
                role: true,
              },
            },
          },
        },
      },
      orderBy: (externalUser, { desc }) => [desc(externalUser.updatedAt)],
    })

    // Filter out admin users
    const filteredUsers = externalUsersData.filter(
      (externalUser) => !externalUser.profile?.profileRoles.some((pr) => pr.role.name === 'admin'),
    )

    return filteredUsers satisfies ExternalUserWithProfileAndUser[]
  })

export const createExternalUser = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(createExternalUserSchema)
  .handler(async ({ data }) => {
    const [newExternalUser] = await db
      .insert(externalUsers)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
      })
      .returning()

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'external_user',
        entityId: newExternalUser.id,
        newData: newExternalUser,
      },
    }).catch(console.error)

    return newExternalUser satisfies SelectExternalUser
  })

export const updateExternalUser = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(updateExternalUserSchema)
  .handler(async ({ data }) => {
    const [oldExternalUser] = await db
      .select()
      .from(externalUsers)
      .where(eq(externalUsers.id, data.externalUserId))
      .limit(1)

    const [updatedExternalUser] = await db
      .update(externalUsers)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(externalUsers.id, data.externalUserId))
      .returning()

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'external_user',
        entityId: updatedExternalUser.id,
        oldData: oldExternalUser,
        newData: updatedExternalUser,
      },
    }).catch(console.error)

    return updatedExternalUser satisfies SelectExternalUser
  })

export const deleteExternalUser = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(deleteExternalUserSchema)
  .handler(async ({ data }) => {
    const [externalUserToDelete] = await db
      .select()
      .from(externalUsers)
      .where(eq(externalUsers.id, data.externalUserId))
      .limit(1)

    const [deletedExternalUser] = await db
      .delete(externalUsers)
      .where(eq(externalUsers.id, data.externalUserId))
      .returning()

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'external_user',
        entityId: deletedExternalUser.id,
        oldData: externalUserToDelete,
      },
    }).catch(console.error)

    return deletedExternalUser satisfies SelectExternalUser
  })
