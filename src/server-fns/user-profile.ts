import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, roles, userRoles } from '@/db/schemas/main'
import { type ProfileResponse, profileResponseSchema } from '@/db/schemas/zod'
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
        },
      })

      if (!profile) {
        throw new Error('Profile not found')
      }

      const userRolesList = await db
        .select({
          roleId: userRoles.roleId,
          roleName: roles.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, session.user.id))

      const response: ProfileResponse = {
        userId: profile.userId,
        email: profile.user.email,
        firstName: profile.owner?.firstName ?? profile.externalUser?.firstName ?? '',
        lastName: profile.owner?.lastName ?? profile.externalUser?.lastName ?? '',
        profileType: profile.profileType,
        ownerId: profile.ownerId,
        externalUserId: profile.externalUserId,
        roles: userRolesList.map((r) => r.roleName),
        image: profile.user.image,
      }

      // Validate response with Zod schema
      const validatedResponse = profileResponseSchema.parse(response)

      return validatedResponse
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  })
