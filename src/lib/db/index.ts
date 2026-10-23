import '@tanstack/react-start/server-only'
import { attachDatabasePool } from '@vercel/functions'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { serverEnv } from '@/lib/config/env.server'

// node-postgres over Neon's pooled URL, as Neon recommends on Vercel: the pool
// lives as long as the function instance, and attachDatabasePool lets Vercel
// close idle clients before the instance is suspended. Outside Vercel it does nothing.
//
// It connects as the app's own role (scripts/neon/app-role.ts), never the
// owner. That role has no grants of its own, so a query that skips withUser()
// is refused outright.
const pool = new Pool({ connectionString: serverEnv.DATABASE_AUTHENTICATED_URL })
attachDatabasePool(pool)

export const db = drizzle({ client: pool })

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Runs `run` in a transaction that knows who is acting, the way Supabase ran
 * each request as its signed-in user. RLS policies, the `created_by` defaults
 * and the audit log read the user with `auth.uid()` (for now the one in
 * scripts/neon/supabase-compat.sql), and the transaction switches to the
 * `authenticated` role their grants and policies are written for.
 *
 * Both are `local` to this transaction, so a pooled connection never carries
 * them over to the next user.
 */
export function withUser<T>(userId: string, run: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`)
    await tx.execute(sql`set local role authenticated`)
    return run(tx)
  })
}
