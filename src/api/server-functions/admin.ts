import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/middleware/auth'

export const isAdminUser = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context

    try {
      // Role is now stored directly on the user object via better-auth admin plugin
      return session.user.role === 'admin'
    } catch (error) {
      console.error('Error checking admin role:', error)
      return false
    }
  })
