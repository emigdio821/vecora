import '@tanstack/react-start/server-only'
import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie, setResponseHeaders } from '@tanstack/react-start/server'
import type { Database } from './database.types'

/**
 * Supabase client for server functions and server routes.
 * Create a new one per request; never share it across requests.
 *
 * Any call that finds an expired session refreshes it here and writes the new
 * cookies on the response, so there's no separate refresh middleware.
 */
export async function createClient() {
  return createServerClient<Database>(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(getCookies()).map(([name, value]) => ({ name, value }))
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value, options } of cookiesToSet) {
            setCookie(name, value, options)
          }
          // Cache-Control: private, so a CDN never stores a refreshed session.
          setResponseHeaders(new Headers(headers))
        },
      },
    },
  )
}
