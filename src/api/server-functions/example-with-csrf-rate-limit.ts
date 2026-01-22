/**
 * Example Server Function with CSRF Protection and Rate Limiting
 *
 * This file demonstrates how to use the CSRF and rate limiting middleware
 * with TanStack Start server functions.
 */

import { createServerFn } from '@tanstack/react-start'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import { csrfMiddleware } from '@/middleware/csrf'
import { apiRateLimiter, authRateLimiter, strictRateLimiter } from '@/middleware/rate-limit'

/**
 * Example 1: Protected route with CSRF and standard rate limiting
 */
export const exampleCreateEntity = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware, // Require authentication
    apiRateLimiter, // 100 requests per minute
    csrfMiddleware, // CSRF protection
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
    csrfMiddleware,
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
    // Note: No CSRF for login (initial auth), but use it for logout
  ])
  .handler(async () => {
    // Your login logic here
    return { success: true }
  })

/**
 * Example 4: Public route with just rate limiting (no auth, no CSRF)
 */
export const examplePublicAPI = createServerFn({ method: 'GET' })
  .middleware([
    apiRateLimiter, // Still rate limit public endpoints
  ])
  .handler(async () => {
    // Your public logic here
    return { data: [] }
  })
