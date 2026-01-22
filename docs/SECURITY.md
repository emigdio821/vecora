# Security Implementation Guide

This document explains how to use the CSRF protection and rate limiting features in Resido.

## Table of Contents
- [CSRF Protection](#csrf-protection)
- [Rate Limiting](#rate-limiting)
- [Usage Examples](#usage-examples)
- [Production Considerations](#production-considerations)

---

## CSRF Protection

### What is CSRF?
Cross-Site Request Forgery (CSRF) is an attack that forces authenticated users to execute unwanted actions. Our implementation uses the **Double Submit Cookie** pattern to prevent this.

### How It Works
1. Server generates a random token and sets it in a cookie
2. Client reads the token and includes it in request headers
3. Server validates both match before processing the request

### Implementation Files
- `src/middleware/csrf.ts` - CSRF middleware
- `src/hooks/use-csrf-token.ts` - React hook to get CSRF token

### Applying CSRF Protection

#### Option 1: Add to Existing Server Functions

Update your server functions to include the CSRF middleware:

```typescript
// src/server-fns/owners.ts
import { csrfMiddleware } from '@/middleware/csrf'

export const createOwner = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,
    csrfMiddleware,  // Add this line
  ])
  .inputValidator(createOwnerSchema)
  .handler(async ({ data }) => {
    return await db.insert(owners).values(data).returning()
  })
```

#### Option 2: Generate CSRF Token in Root Layout

In your root layout, generate and set the CSRF token cookie:

```typescript
// src/routes/__root.tsx
import { generateCsrfToken } from '@/middleware/csrf'

export default function Root() {
  // Generate CSRF token on server
  if (typeof window === 'undefined') {
    const { token, cookie } = generateCsrfToken()
    // Set cookie in response headers
  }

  return <Outlet />
}
```

#### Option 3: Automatic CSRF Headers with Axios

If you're using axios or a similar HTTP client:

```typescript
// src/lib/api-client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
})

// Add CSRF token to all requests
apiClient.interceptors.request.use((config) => {
  const cookies = document.cookie.split(';').map((c) => c.trim())
  const csrfCookie = cookies.find((c) => c.startsWith('csrf_token='))

  if (csrfCookie) {
    const token = csrfCookie.split('=')[1]
    config.headers['x-csrf-token'] = token
  }

  return config
})
```

### Protected Routes

CSRF protection should be applied to:
- ✅ All POST, PUT, PATCH, DELETE requests
- ✅ Any state-changing operations
- ❌ GET requests (not needed)
- ❌ Initial login (no session yet)

---

## Rate Limiting

### What is Rate Limiting?
Rate limiting prevents abuse by restricting the number of requests from a single IP address within a time window.

### Implementation Files
- `src/middleware/rate-limit.ts` - Rate limiting middleware

### Available Rate Limiters

We provide three pre-configured rate limiters:

#### 1. API Rate Limiter (Standard)
```typescript
import { apiRateLimiter } from '@/middleware/rate-limit'

// 100 requests per minute
export const getSomeData = createServerFn()
  .middleware([apiRateLimiter])
  .handler(async () => { /* ... */ })
```

#### 2. Auth Rate Limiter (Strict)
```typescript
import { authRateLimiter } from '@/middleware/rate-limit'

// 10 requests per minute
export const login = createServerFn({ method: 'POST' })
  .middleware([authRateLimiter])
  .handler(async () => { /* ... */ })
```

#### 3. Strict Rate Limiter (Very Strict)
```typescript
import { strictRateLimiter } from '@/middleware/rate-limit'

// 5 requests per minute
export const deleteAllData = createServerFn({ method: 'DELETE' })
  .middleware([strictRateLimiter])
  .handler(async () => { /* ... */ })
```

### Custom Rate Limiter

Create a custom rate limiter with your own configuration:

```typescript
import { createRateLimiter } from '@/middleware/rate-limit'

const customRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50,
  message: 'Custom rate limit message',
})

export const myFunction = createServerFn()
  .middleware([customRateLimiter])
  .handler(async () => { /* ... */ })
```

### Rate Limit Headers

Rate limit information is included in response headers:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - When the limit resets (ISO timestamp)
- `Retry-After` - Seconds until retry (when rate limited)

---

## Usage Examples

### Example 1: Standard CRUD Operation

```typescript
// src/server-fns/owners.ts
import { createServerFn } from '@tanstack/react-start/server'
import { authMiddleware } from '@/middleware/auth'
import { csrfMiddleware } from '@/middleware/csrf'
import { apiRateLimiter } from '@/middleware/rate-limit'

export const createOwner = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,      // Require authentication
    apiRateLimiter,     // 100 requests/min
    csrfMiddleware,     // CSRF protection
  ])
  .inputValidator(createOwnerSchema)
  .handler(async ({ data }) => {
    return await db.insert(owners).values(data).returning()
  })
```

### Example 2: Admin-Only Operation

```typescript
// src/server-fns/admin.ts
import { strictRateLimiter } from '@/middleware/rate-limit'

export const deleteAllUsers = createServerFn({ method: 'DELETE' })
  .middleware([
    authMiddleware,
    adminOnlyMiddleware,
    strictRateLimiter,  // 5 requests/min
    csrfMiddleware,
  ])
  .handler(async () => {
    // Dangerous operation - strictly rate limited
  })
```

### Example 3: Login Endpoint

```typescript
// src/server-fns/session.ts
import { authRateLimiter } from '@/middleware/rate-limit'

export const login = createServerFn({ method: 'POST' })
  .middleware([
    authRateLimiter,  // 10 requests/min
    // No CSRF on initial login
  ])
  .handler(async ({ data }) => {
    // Login logic
  })
```

### Example 4: Public API

```typescript
// src/server-fns/public.ts
export const getPublicData = createServerFn()
  .middleware([
    apiRateLimiter,  // Still rate limit public endpoints
  ])
  .handler(async () => {
    return { data: [] }
  })
```

---

## Production Considerations

### 1. Rate Limiting Storage

**Current Implementation**: In-memory store (resets on server restart)

**For Production**, consider using Redis:

```typescript
// Example with Redis (requires redis package)
import { createClient } from 'redis'

const redis = createClient({ url: process.env.REDIS_URL })

// Modify rate-limit.ts to use Redis instead of Map
```

**Why Redis?**
- Persists across server restarts
- Works with multiple server instances
- Scales better than in-memory

### 2. CSRF Token Rotation

Consider rotating CSRF tokens periodically:
- On login/logout
- Every N hours
- After sensitive operations

### 3. IP Address Detection

Behind a reverse proxy (Nginx, Cloudflare):
```typescript
// Already handled in rate-limit.ts
// Checks x-forwarded-for and x-real-ip headers
```

Make sure your reverse proxy sets these headers correctly.

### 4. Environment-Specific Configuration

```typescript
// src/config/security.ts
export const RATE_LIMITS = {
  development: {
    api: 1000,  // More lenient in dev
    auth: 100,
    strict: 50,
  },
  production: {
    api: 100,
    auth: 10,
    strict: 5,
  },
}
```

### 5. Monitoring

Add logging for security events:

```typescript
import { logger } from '@/lib/logger'

// Rate limit exceeded
logger.warn('Rate limit exceeded', { ip, endpoint })

// CSRF failed
logger.warn('CSRF validation failed', { ip, endpoint })
```

Integrate with your monitoring service (Sentry, DataDog, etc.).

### 6. Testing Rate Limits

```bash
# Test rate limiting with curl
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}'
done

# Should get 429 after 10 requests
```

---

## Gradual Rollout Strategy

### Phase 1: Add Rate Limiting (Low Risk)
1. Add `apiRateLimiter` to all server functions
2. Monitor logs for rate limit hits
3. Adjust limits based on usage patterns

### Phase 2: Add CSRF (Medium Risk)
1. Generate CSRF tokens in root layout
2. Add `csrfMiddleware` to server functions
3. Test all forms and mutations
4. Deploy to staging first

### Phase 3: Tighten Limits (After Monitoring)
1. Use `authRateLimiter` for auth routes
2. Use `strictRateLimiter` for sensitive operations
3. Monitor for false positives

---

## Troubleshooting

### CSRF Token Issues

**Problem**: "CSRF validation failed" errors

**Solutions**:
1. Check cookie is being set: `document.cookie` in browser console
2. Verify token in header: Check Network tab → Request Headers → x-csrf-token
3. Ensure SameSite=Strict cookies work (requires HTTPS in production)
4. Check if cookie path is correct

### Rate Limiting Issues

**Problem**: Legitimate users hitting rate limits

**Solutions**:
1. Increase limits: `maxRequests` in rate limiter config
2. Increase window: `windowMs` in rate limiter config
3. Whitelist IP ranges for trusted sources
4. Use Redis for distributed rate limiting

**Problem**: Rate limits not working

**Solutions**:
1. Check IP detection: Log `getClientIp(request)`
2. Verify middleware order: Rate limiter should be early in chain
3. Check if behind proxy: Ensure forwarded headers are set

---

## Quick Reference

### Middleware Order

Recommended order for server function middleware:

```typescript
createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,           // 1. Authentication
    adminOnlyMiddleware,   // 2. Authorization
    apiRateLimiter,          // 3. Rate limiting
    csrfMiddleware,          // 4. CSRF protection
  ])
  .inputValidator(schema)    // 5. Input validation
  .handler(async () => {})   // 6. Business logic
```

### Security Checklist

- [ ] Rate limiting on all endpoints
- [ ] CSRF protection on state-changing operations
- [ ] Authentication where needed
- [ ] Authorization checks for admin routes
- [ ] Input validation with Zod
- [ ] Logging for security events
- [ ] Monitoring for rate limit abuse
- [ ] Redis for production rate limiting
- [ ] HTTPS in production
- [ ] Security headers configured

---

## Support

For questions or issues:
- Check the logs: `src/lib/logger.ts`
- Review middleware code: `src/middleware/`
- Open an issue on GitHub
