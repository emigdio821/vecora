import { createMiddleware } from '@tanstack/react-start'
import { isAdminUser } from '@/server-fns/admin'

export const adminOnlyAPIMiddleware = createMiddleware().server(async ({ next }) => {
  const isAadmin = await isAdminUser()

  if (!isAadmin) {
    return new Response('Unauthorized', { status: 401 })
  }

  return next()
})
