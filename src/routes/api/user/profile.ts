import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, roles, userRoles } from '@/db/schemas/main'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/api/user/profile')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Get session from auth
        const session = await auth.api.getSession({
          headers: request.headers,
        })

        if (!session?.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        try {
          // Get user profile with related data
          const profile = await db.query.profiles.findFirst({
            where: eq(profiles.userId, session.user.id),
            with: {
              owner: true,
              externalUser: true,
            },
          })

          if (!profile) {
            return new Response(JSON.stringify({ error: 'Profile not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          // Get user roles
          const userRolesList = await db
            .select({
              roleId: userRoles.roleId,
              roleName: roles.name,
              roleDescription: roles.description,
              assignedAt: userRoles.assignedAt,
            })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(userRoles.userId, session.user.id))

          // Build response
          const profileData =
            profile.ownerId && profile.owner
              ? {
                  type: 'owner' as const,
                  id: profile.owner.id,
                  firstName: profile.owner.firstName,
                  lastName: profile.owner.lastName,
                  phone: profile.owner.phone,
                  email: profile.owner.email,
                  address: profile.owner.address,
                }
              : profile.externalUser
                ? {
                    type: 'external' as const,
                    id: profile.externalUser.id,
                    firstName: profile.externalUser.firstName,
                    lastName: profile.externalUser.lastName,
                    phone: profile.externalUser.phone,
                    email: profile.externalUser.email,
                    address: profile.externalUser.address,
                  }
                : null

          const response = {
            userId: session.user.id,
            email: session.user.email,
            name: session.user.name,
            profileType: profile.profileType,
            profile: profileData,
            roles: userRolesList.map((role) => ({
              id: role.roleId,
              name: role.roleName,
              description: role.roleDescription,
              assignedAt: role.assignedAt,
            })),
          }

          return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error fetching user profile:', error)
          return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      },
    },
  },
})
