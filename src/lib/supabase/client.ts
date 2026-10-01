import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

/**
 * Supabase client for components.
 * Safe to call on every render; the library caches the instance in the browser.
 */
export function createClient() {
  return createBrowserClient<Database>(
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}
