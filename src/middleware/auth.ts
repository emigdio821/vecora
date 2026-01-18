import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getServerSession } from '@/server-fns/session'

export const authRouteMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await getServerSession()

  if (!session) {
    throw redirect({ to: '/login' })
  }

  return next()
})

export const authAPIMiddleware = createMiddleware().server(async ({ next }) => {
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
