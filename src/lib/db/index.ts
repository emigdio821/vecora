import '@tanstack/react-start/server-only'
import { attachDatabasePool } from '@vercel/functions'
import { serverEnv } from '@/lib/config/env.server'
import { actorTransaction, createDatabase, type Database, type Transaction } from '@/lib/db/client'

export type { Database, Transaction } from '@/lib/db/client'

// node-postgres over Neon's pooled URL, as Neon recommends on Vercel: the pool
// lives as long as the function instance, and attachDatabasePool lets Vercel
// close idle clients before the instance is suspended. Outside Vercel it does nothing.
const { db: database, pool } = createDatabase(serverEnv.DATABASE_URL)
attachDatabasePool(pool)

/** Reads go straight through it; writes through transactionAs(). */
export const db: Database = database

/** A write transaction on behalf of `actorId`, so the activity log knows who did it (see actorTransaction). */
export function transactionAs<T>(actorId: string, run: (tx: Transaction) => Promise<T>): Promise<T> {
  return actorTransaction(db, actorId, run)
}
