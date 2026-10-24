import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

// Better Auth's HTTP endpoints, for src/lib/auth/client.ts. Only these are
// reachable: the rest (the admin plugin's, updating the user, changing the
// email...) would write around the permissions in src/lib/auth/permissions.ts,
// so the app calls what it needs from server functions instead (auth.api.*).
const OPEN_PATHS = new Set(['/api/auth/sign-in/email', '/api/auth/sign-out', '/api/auth/get-session'])

function handle(request: Request) {
  const { pathname } = new URL(request.url)
  if (!OPEN_PATHS.has(pathname)) {
    return new Response('Not Found', { status: 404 })
  }
  return auth.handler(request)
}

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
})
