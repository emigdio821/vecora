import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from './database.types'

/**
 * Refreshes the Supabase session on every request and writes any rotated
 * tokens back to both the request (for this render) and the response (for
 * the browser). Called from src/proxy.ts.
 *
 * Also does an optimistic redirect: signed-out users go to /login, signed-in
 * users are kept away from /login. The (authed) layout re-checks server-side.
 */
// /auth/confirm turns an invite link into a session, so it must be reachable
// signed out; unlike /login it stays reachable signed in too (the link may be
// opened by someone who already has another session in the browser).
const PUBLIC_PATHS = ['/login', '/auth/confirm']
const SIGNED_OUT_ONLY_PATHS = ['/login']
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // Do not remove. getClaims() validates the JWT and triggers a refresh when
  // the access token is close to expiry, which is what keeps users signed in.
  const { data } = await supabase.auth.getClaims()
  const isSignedIn = Boolean(data)
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path))
  const isSignedOutOnly = SIGNED_OUT_ONLY_PATHS.some((path) => pathname.startsWith(path))

  if (!isSignedIn && !isPublic) {
    return redirectWithCookies(request, response, '/login')
  }

  if (isSignedIn && isSignedOutOnly) {
    return redirectWithCookies(request, response, '/')
  }

  return response
}

/** Redirect while keeping any refreshed auth cookies that were set on `from`. */
function redirectWithCookies(request: NextRequest, from: NextResponse, pathname: string) {
  const url = request.nextUrl.clone()
  url.pathname = pathname
  const redirect = NextResponse.redirect(url)
  for (const cookie of from.cookies.getAll()) {
    redirect.cookies.set(cookie)
  }
  return redirect
}
