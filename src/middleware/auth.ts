import { createMiddleware } from '@tanstack/react-start'
import { getServerSession } from '@/api/server-functions/session'

export const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const session = await getServerSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  return next({
    context: {
      session,
    },
  })
})
