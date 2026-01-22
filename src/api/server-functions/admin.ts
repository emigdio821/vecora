import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { roles, userRoles } from '@/db/schemas/main'
import { authMiddleware } from '@/middleware/auth'

export const isAdminUser = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context

    try {
      const adminRole = await db
        .select({ roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(and(eq(userRoles.userId, session.user.id), eq(roles.name, 'admin')))
        .limit(1)

      return adminRole.length > 0
    } catch (error) {
      console.error('Error checking admin role:', error)
      return false
    }
  })
