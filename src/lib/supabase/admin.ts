import '@tanstack/react-start/server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/config/env'
import { serverEnv } from '@/lib/config/env.server'
import type { Database } from './database.types'

/**
 * Service-role client for the Auth Admin API (create / invite / delete users).
 * Bypasses RLS, so use it only for the auth calls themselves and do every
 * permission check and table write through the caller's regular client.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.VITE_SUPABASE_URL, serverEnv.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
