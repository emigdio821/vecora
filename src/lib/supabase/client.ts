import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/config/env'
import type { Database } from './database.types'

/**
 * Supabase client for components.
 * Safe to call on every render; the library caches the instance in the browser.
 */
export function createClient() {
  return createBrowserClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_KEY)
}
