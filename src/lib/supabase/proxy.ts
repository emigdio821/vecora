import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import type { Database } from './database.types'

/**
 * Refreshes the Supabase session on every request and writes any rotated
 * tokens back to both the request (for this render) and the response (for
 * the browser). Called from src/proxy.ts.
 *
 * Route protection (redirecting signed-out users) is intentionally not here
 * yet; add it once the login page exists.
 */
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
  await supabase.auth.getClaims()

  return response
}
