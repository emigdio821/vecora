# Security Implementation Guide

This document explains how to use the rate limiting feature in Resido.

## Table of Contents
- [Rate Limiting](#rate-limiting)
- [Usage Examples](#usage-examples)
- [Production Considerations](#production-considerations)

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
import { apiRateLimiter } from '@/middleware/rate-limit'

export const createOwner = createServerFn({ method: 'POST' })
  .middleware([
    authMiddleware,      // Require authentication
    apiRateLimiter,     // 100 requests/min
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

### 2. IP Address Detection

Behind a reverse proxy (Nginx, Cloudflare):
```typescript
// Already handled in rate-limit.ts
// Checks x-forwarded-for and x-real-ip headers
```

Make sure your reverse proxy sets these headers correctly.

### 3. Environment-Specific Configuration

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

### 4. Monitoring

Add logging for security events:

```typescript
import { logger } from '@/lib/logger'

// Rate limit exceeded
logger.warn('Rate limit exceeded', { ip, endpoint })
```

Integrate with your monitoring service (Sentry, DataDog, etc.).

### 5. Testing Rate Limits

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

### Phase 2: Tighten Limits (After Monitoring)
1. Use `authRateLimiter` for auth routes
2. Use `strictRateLimiter` for sensitive operations
3. Monitor for false positives

---

## Troubleshooting

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
  ])
  .inputValidator(schema)    // 4. Input validation
  .handler(async () => {})   // 5. Business logic
```

### Security Checklist

- [ ] Rate limiting on all endpoints
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
