import { isRedirect } from '@tanstack/react-router'
import { createCsrfMiddleware, createMiddleware, createStart } from '@tanstack/react-start'
import { loginHrefForCurrentPage } from '@/lib/utils'

/**
 * A server function that finds the session gone throws a redirect to /login
 * (lib/supabase/auth-middleware.ts). The caller is usually a mutation or a
 * query, which would show it as an error; a full page load instead resets
 * the cached user and lands on the login page.
 */
const sessionExpiredMiddleware = createMiddleware({ type: 'function' }).client(async ({ next }) => {
  try {
    return await next()
  } catch (error) {
    if (!isRedirect(error)) throw error
    let href = error.options.href ?? '/login'
    if (href === '/login') href = loginHrefForCurrentPage()
    window.location.assign(href)
    // The page is going away; never settle, so no error toast flashes first.
    return new Promise<never>(() => {})
  }
})

// Server functions are same-origin RPC: refuse calls another site's page makes
// with the user's cookies. Pages and server routes (the PDFs) aren't checked.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
  functionMiddleware: [sessionExpiredMiddleware],
}))
