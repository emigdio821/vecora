/**
 * Example Server Function with Rate Limiting
 *
 * This file demonstrates how to use the rate limiting middleware
 * with TanStack Start server functions.
 */

import { createServerFn } from '@tanstack/react-start'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import { apiRateLimiter, authRateLimiter, strictRateLimiter } from '@/middleware/rate-limit'

/**
 * Example 1: Protected route with standard rate limiting
 */
export const exampleCreateEntity = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware, // Require authentication
    apiRateLimiter, // 100 requests per minute
  ])
  .handler(async () => {
    // Your business logic here
    return { success: true }
  })

/**
 * Example 2: Admin-only route with strict rate limiting
 */
export const exampleAdminAction = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,
    adminOnlyMiddleware, // Require admin role
    strictRateLimiter, // 5 requests per minute
  ])
  .handler(async () => {
    // Your admin logic here
    return { success: true }
  })

/**
 * Example 3: Authentication route with auth-specific rate limiting
 */
export const exampleLogin = createServerFn({ method: 'POST' })
  .middleware([
    authRateLimiter, // 10 requests per minute for auth routes
  ])
  .handler(async () => {
    // Your login logic here
    return { success: true }
  })

/**
 * Example 4: Public route with just rate limiting (no auth)
 */
export const examplePublicAPI = createServerFn({ method: 'GET' })
  .middleware([
    apiRateLimiter, // Still rate limit public endpoints
  ])
  .handler(async () => {
    // Your public logic here
    return { data: [] }
  })
