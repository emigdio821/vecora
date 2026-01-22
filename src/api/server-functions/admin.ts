import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { profileRoles, profiles, roles } from '@/db/schemas/main'
import { authMiddleware } from '@/middleware/auth'

export const isAdminUser = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context

    try {
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, session.user.id),
      })

      if (!profile) {
        return false
      }

      const adminRole = await db
        .select({ roleName: roles.name })
        .from(profileRoles)
        .innerJoin(roles, eq(profileRoles.roleId, roles.id))
        .where(and(eq(profileRoles.profileId, profile.id), eq(roles.name, 'admin')))
        .limit(1)

      return adminRole.length > 0
    } catch (error) {
      console.error('Error checking admin role:', error)
      return false
    }
  })
