import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { z } from 'zod'
import { notifications } from '..'
import type { ProfileWithUserAndRoles } from './profiles'

export const insertNotificationSchema = createInsertSchema(notifications)
export const selectNotificationSchema = createSelectSchema(notifications)

export type InsertNotification = z.infer<typeof insertNotificationSchema>
export type SelectNotification = z.infer<typeof selectNotificationSchema>

// Type for notifications with profile relations included
export type NotificationWithRelations = SelectNotification & {
  profile: ProfileWithUserAndRoles | null
}
