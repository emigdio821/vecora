import '@tanstack/react-start/server-only'
import { attachDatabasePool } from '@vercel/functions'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { serverEnv } from '@/lib/config/env.server'

// node-postgres over Neon's pooled URL, as Neon recommends on Vercel: the pool
// lives as long as the function instance, and attachDatabasePool lets Vercel
// close idle clients before the instance is suspended. Outside Vercel it does nothing.
const pool = new Pool({ connectionString: serverEnv.DATABASE_URL })
attachDatabasePool(pool)

export const db = drizzle({ client: pool })

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Runs `run` in a transaction that knows who is acting. RLS policies, the
 * `created_by` defaults and the audit log read it with `private.current_user_id()`,
 * where Supabase had `auth.uid()`. `set_config(..., true)` scopes it to this
 * transaction, so a pooled connection never carries it over to the next user.
 */
export function withUser<T>(userId: string, run: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.user_id', ${userId}, true)`)
    return run(tx)
  })
}
