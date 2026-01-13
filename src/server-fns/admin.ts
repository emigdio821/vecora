import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { roles, userRoles } from '@/db/schemas/main'
import { auth } from '@/lib/auth'

export const isAdminUser = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session?.user) {
    return false
  }

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
