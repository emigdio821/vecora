import { handleStartError } from '@tanstack/react-start/server'
import handler, { createServerEntry } from '@tanstack/react-start/server-entry'
import { serverEnv } from '@/lib/config/env.server'
import { MAINTENANCE_PATH } from '@/lib/maintenance'
import { paraglideMiddleware } from '@/paraglide/server'

const UNAVAILABLE_HEADERS = { 'cache-control': 'no-store', 'retry-after': '3600' }

/**
 * While MAINTENANCE_MODE is on, nothing but the maintenance page answers:
 * pages are sent to it, and server functions and the API get a bare 503, so
 * a tab left open can't write during the maintenance. Null when the request
 * may go on.
 */
function maintenanceGate(request: Request, pathname: string): Response | null {
  const onMaintenancePage = pathname === MAINTENANCE_PATH

  if (!serverEnv.MAINTENANCE_MODE) {
    // Over: anyone still on the page gets the app back.
    if (onMaintenancePage) {
      return Response.redirect(new URL('/', request.url), 307)
    }
    return null
  }

  if (onMaintenancePage) {
    return null
  }
  const isPage = request.method === 'GET' && (request.headers.get('accept') ?? '').includes('text/html')
  if (isPage) {
    return new Response(null, {
      status: 307,
      headers: { ...UNAVAILABLE_HEADERS, location: MAINTENANCE_PATH },
    })
  }
  return new Response(null, { status: 503, headers: UNAVAILABLE_HEADERS })
}

// Every request (pages, server functions, the PDF) runs with the locale of its
// cookie, so getLocale() and the m.* messages answer in the visitor's language.
export default createServerEntry({
  fetch(request) {
    return paraglideMiddleware(request, async () => {
      const { pathname } = new URL(request.url)
      const gate = maintenanceGate(request, pathname)
      if (gate) {
        return gate
      }

      try {
        const response = await handler.fetch(request)
        // The page itself says "unavailable" to crawlers and monitors too.
        if (pathname === MAINTENANCE_PATH) {
          const headers = new Headers(response.headers)
          for (const [name, value] of Object.entries(UNAVAILABLE_HEADERS)) {
            headers.set(name, value)
          }
          return new Response(response.body, { status: 503, headers })
        }
        return response
      } catch (error) {
        // Start doesn't log the errors it turns into its error response, so do it
        // here to keep them in the Vercel logs.
        console.error(error)
        return handleStartError(error)
      }
    })
  },
})
