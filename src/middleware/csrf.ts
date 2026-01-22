import { createMiddleware } from '@tanstack/react-start'
import { logger } from '@/lib/logger'

/**
 * CSRF Protection Middleware
 *
 * Protects against Cross-Site Request Forgery attacks by validating tokens
 * on state-changing operations (POST, PUT, PATCH, DELETE).
 *
 * Implementation uses the Double Submit Cookie pattern:
 * 1. Server sets a random token in a cookie
 * 2. Client includes the same token in request headers
 * 3. Server validates both match
 */

const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_LENGTH = 32

/**
 * Generate a cryptographically secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Extract CSRF token from cookie
 */
function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').map((c) => c.trim())
  const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`))

  if (!csrfCookie) return null

  return csrfCookie.split('=')[1] || null
}

/**
 * CSRF middleware that validates tokens on state-changing requests
 */
export const csrfMiddleware = createMiddleware().server(async ({ next, request }) => {
  const method = request.method
  const url = new URL(request.url)

  // Only protect state-changing methods
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  if (!protectedMethods.includes(method)) {
    return next()
  }

  // Skip CSRF for API auth routes (they have their own protection)
  if (url.pathname.startsWith('/api/auth/')) {
    return next()
  }

  // Get token from cookie
  const cookieToken = getTokenFromCookie(request.headers.get('cookie'))

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  // Validate tokens match
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    logger.warn('CSRF validation failed', {
      method,
      path: url.pathname,
      hasCookieToken: !!cookieToken,
      hasHeaderToken: !!headerToken,
    })

    return new Response('CSRF validation failed', {
      status: 403,
      statusText: 'Forbidden',
    })
  }

  return next()
})

/**
 * Generate and set CSRF token in cookie
 * Call this when rendering pages with forms
 */
export function generateCsrfToken(): { token: string; cookie: string } {
  const token = generateToken()

  const cookie = `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`

  return { token, cookie }
}
