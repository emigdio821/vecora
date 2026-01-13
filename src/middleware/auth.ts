import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getServerSession } from '@/server-fns/session'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await getServerSession()

  if (!session) {
    throw redirect({ to: '/login' })
  }

  return await next()
})
