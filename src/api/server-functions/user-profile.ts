import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schemas/main'
import type { ProfileResponse } from '@/db/schemas/zod/profiles'
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

      const response: ProfileResponse = {
        userId: profile.userId,
        email: profile.user.email,
        firstName: profile.owner?.firstName ?? profile.externalUser?.firstName ?? '',
        lastName: profile.owner?.lastName ?? profile.externalUser?.lastName ?? '',
        profileType: profile.profileType,
        ownerId: profile.ownerId,
        externalUserId: profile.externalUserId,
        roles: profile.profileRoles.map((pr) => pr.role.name),
        image: profile.user.image,
      }

      return response
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  })
