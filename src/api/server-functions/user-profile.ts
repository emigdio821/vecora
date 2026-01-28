import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schemas/main'
import type { ProfileWithRoles } from '@/db/schemas/zod/profiles'
import { authMiddleware } from '@/middleware/auth'

export const getUserProfile = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context

    try {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, session.user.id),
        with: {
          user: true,
          owner: true,
          externalUser: true,
          profileRoles: {
            with: {
              role: true,
            },
          },
        },
      })

      if (!profile) {
        throw new Error('Profile not found')
      }

      return profile satisfies ProfileWithRoles
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  })
