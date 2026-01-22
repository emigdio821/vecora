import { createMiddleware } from '@tanstack/react-start'
import { logger } from '@/lib/logger'

/**
 * Rate Limiting Middleware
 *
 * Implements a sliding window rate limiter to prevent abuse.
 * Tracks requests by IP address and enforces configurable limits.
 *
 * Default limits:
 * - 100 requests per minute per IP
 * - Configurable per route
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

interface RequestRecord {
  count: number
  resetTime: number
}

// In-memory store (for production, use Redis or similar)
const requestStore = new Map<string, RequestRecord>()

// Cleanup old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [key, record] of requestStore.entries()) {
      if (record.resetTime < now) {
        requestStore.delete(key)
      }
    }
  },
  5 * 60 * 1000,
)

/**
 * Get client IP address from request
 */
function getClientIp(request: Request): string {
  // Check for forwarded IP (from reverse proxy)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to 'unknown' if no IP found
  return 'unknown'
}

/**
 * Create rate limit middleware with custom configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = config

  return createMiddleware().server(async ({ next, request }) => {
    const ip = getClientIp(request)
    const key = `${ip}:${new URL(request.url).pathname}`
    const now = Date.now()

    // Get or create record
    let record = requestStore.get(key)

    if (!record || record.resetTime < now) {
      // Create new record
      record = {
        count: 1,
        resetTime: now + windowMs,
      }
      requestStore.set(key, record)
    } else {
      // Increment existing record
      record.count++
    }

    // Check if limit exceeded
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)

      logger.warn('Rate limit exceeded', {
        ip,
        path: new URL(request.url).pathname,
        count: record.count,
        limit: maxRequests,
      })

      return new Response(JSON.stringify({ error: message }), {
        status: 429,
        statusText: 'Too Many Requests',
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
        },
      })
    }

    // Add rate limit headers
    const response = await next()

    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', (maxRequests - record.count).toString())
      response.headers.set('X-RateLimit-Reset', new Date(record.resetTime).toISOString())
    }

    return response
  })
}

/**
 * Default rate limiter for general API routes
 * 100 requests per minute
 */
export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
})

/**
 * Strict rate limiter for authentication routes
 * 10 requests per minute
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many authentication attempts, please try again later.',
})

/**
 * Very strict rate limiter for sensitive operations
 * 5 requests per minute
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Rate limit exceeded for sensitive operation.',
})
