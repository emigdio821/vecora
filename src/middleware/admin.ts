import { createMiddleware } from '@tanstack/react-start'
import { isAdminUser } from '@/api/server-functions/admin'

export const adminOnlyMiddleware = createMiddleware().server(async ({ next }) => {
  const isAadmin = await isAdminUser()

  if (!isAadmin) {
    return new Response('Unauthorized', { status: 401 })
  }

  return next()
})
