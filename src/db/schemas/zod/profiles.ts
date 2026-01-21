import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { profiles, profileTypeEnum } from '../main'

export const insertProfileSchema = createInsertSchema(profiles)
export const selectProfileSchema = createSelectSchema(profiles)

export const profileResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  profileType: z.enum(profileTypeEnum.enumValues),
  ownerId: z.string().nullable(),
  externalUserId: z.string().nullable(),
  roles: z.array(z.string()),
  image: z.string().nullable(),
})

export type InsertProfile = z.infer<typeof insertProfileSchema>
export type SelectProfile = z.infer<typeof selectProfileSchema>
export type ProfileResponse = z.infer<typeof profileResponseSchema>
