import { z } from 'zod'

export const createNotificationSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255, 'El título es muy largo'),
  message: z.string().min(1, 'El mensaje es requerido').max(500, 'El mensaje es muy largo'),
  expiresAt: z.date('Fecha de expiración inválida').nullable(),
})

export type CreateNotificationData = z.infer<typeof createNotificationSchema>

export const deleteNotificationSchema = z.object({
  notificationId: z.uuid('ID de notificación inválido'),
})

export type DeleteNotificationData = z.infer<typeof deleteNotificationSchema>
