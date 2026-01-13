import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, roles, userRoles } from '@/db/schemas/main'
import { type ProfileResponse, profileResponseSchema } from '@/db/schemas/zod'
import { authAPIMiddleware } from '@/middleware/auth'

export const Route = createFileRoute('/api/user/profile')({
  server: {
    middleware: [authAPIMiddleware],
    handlers: {
      GET: async ({ context }) => {
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
            return new Response('Profile not found', { status: 404 })
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

          return new Response(JSON.stringify(validatedResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error fetching user profile:', error)
          return new Response('Internal server error', { status: 500 })
        }
      },
    },
  },
})
