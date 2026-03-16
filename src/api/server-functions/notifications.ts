import { createServerFn } from '@tanstack/react-start'
import { eq, gt, isNull, or } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { notifications, profiles } from '@/db/schema'
import { authMiddleware } from '@/middleware/auth'
import {
  createNotificationSchema,
  deleteNotificationSchema,
  updateNotificationSchema,
} from '@/schemas/notifications'

export const getNotificationsList = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const userNotifications = await db.query.notifications.findMany({
      where: or(isNull(notifications.expiresAt), gt(notifications.expiresAt, new Date())),
      with: {
        profile: {
          with: {
            user: true,
          },
        },
      },
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    })

    return userNotifications
  })

export const getMyNotificationsList = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context

    const myNotifications = await db.query.notifications.findMany({
      where: eq(notifications.createdBy, session.user.id),
      with: {
        profile: {
          with: {
            user: true,
          },
        },
      },
      orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
    })

    return myNotifications
  })

export const createNotification = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(createNotificationSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const { title, message, expiresAt } = data

    // Get the user's profile
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    })

    const [newNotification] = await db
      .insert(notifications)
      .values({
        createdBy: session.user.id,
        profileId: profile?.id ?? null,
        title,
        message,
        expiresAt: expiresAt ?? null,
      })
      .returning()

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'notification',
        entityId: newNotification.id,
        newData: newNotification,
      },
    }).catch(console.error)

    return newNotification
  })

export const updateNotification = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(updateNotificationSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const { notificationId, title, message, expiresAt } = data

    const [notificationToUpdate] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1)

    if (!notificationToUpdate) {
      throw new Error('Notificación no encontrada')
    }

    // Only allow the creator to update the notification
    if (notificationToUpdate.createdBy !== session.user.id) {
      throw new Error('No tienes permiso para editar esta notificación')
    }

    const [updatedNotification] = await db
      .update(notifications)
      .set({
        title,
        message,
        expiresAt: expiresAt ?? null,
      })
      .where(eq(notifications.id, notificationId))
      .returning()

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'notification',
        entityId: notificationId,
        oldData: notificationToUpdate,
        newData: updatedNotification,
      },
    }).catch(console.error)

    return updatedNotification
  })

export const deleteNotification = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator(deleteNotificationSchema)
  .handler(async ({ context, data }) => {
    const { session } = context
    const { notificationId } = data

    const [notificationToDelete] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1)

    if (!notificationToDelete) {
      throw new Error('Notificación no encontrada')
    }

    // Only allow the creator to delete the notification
    if (notificationToDelete.createdBy !== session.user.id) {
      throw new Error('No tienes permiso para eliminar esta notificación')
    }

    // Hard delete the notification
    const deletedNotifications = await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId))
      .returning()

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'notification',
        entityId: notificationId,
        oldData: notificationToDelete,
      },
    }).catch(console.error)

    return deletedNotifications
  })
