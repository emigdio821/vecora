import { z } from 'zod'

export const createNotificationSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(50, 'El título es muy largo'),
  message: z.string().min(1, 'El mensaje es requerido').max(200, 'El mensaje es muy largo'),
  expiresAt: z.date('Fecha de expiración inválida').nullable(),
})

export type CreateNotificationData = z.infer<typeof createNotificationSchema>

export const updateNotificationSchema = z.object({
  notificationId: z.uuid('ID de notificación inválido'),
  title: z.string().min(1, 'El título es requerido').max(50, 'El título es muy largo'),
  message: z.string().min(1, 'El mensaje es requerido').max(200, 'El mensaje es muy largo'),
  expiresAt: z.date('Fecha de expiración inválida').nullable(),
})

export type UpdateNotificationData = z.infer<typeof updateNotificationSchema>

export const deleteNotificationSchema = z.object({
  notificationId: z.uuid('ID de notificación inválido'),
})

export type DeleteNotificationData = z.infer<typeof deleteNotificationSchema>
