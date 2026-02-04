import { createMiddleware } from '@tanstack/react-start'
import { isAdminUser } from '@/api/server-functions/admin'

export const adminOnlyMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const isAadmin = await isAdminUser()

  if (!isAadmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  return next()
})
