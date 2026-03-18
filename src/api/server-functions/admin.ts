import { createServerFn } from '@tanstack/react-start'
import { logger } from '@/lib/logger'
import { authMiddleware } from '@/middleware/auth'
import { Role } from '@/types/rbac'

export const isAdminUser = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context

    try {
      return session.user.role === Role.SUPER_ADMIN || session.user.role === Role.ADMIN
    } catch (error) {
      logger.error('Error checking admin role:', error)
      return false
    }
  })
