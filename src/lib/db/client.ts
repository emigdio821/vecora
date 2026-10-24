// The database client, without the app's environment: the server (lib/db)
// and the scripts (seed, reset) each make theirs from a connection string.
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { withVerifiedSsl } from './connection-string'
import { relations } from './relations'

export function createDatabase(connectionString: string) {
  const pool = new pg.Pool({ connectionString: withVerifiedSsl(connectionString) })
  // The relations carry the tables too, so db.query.<table> is typed with `with:` joins.
  const db = drizzle({ client: pool, relations })
  return { db, pool }
}

export type Database = ReturnType<typeof createDatabase>['db']

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

/**
 * Runs `run` in a transaction of `db` on behalf of `actorId`, for every
 * write: the activity log's trigger reads who acted from app.actor_id.
 * `local`, so a pooled connection never carries it over to the next request.
 *
 * Says who acted, nothing more: whether they may is the server function's
 * check, before it gets here. The app uses transactionAs() from lib/db.
 */
export function actorTransaction<T>(
  db: Database,
  actorId: string,
  run: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.actor_id', ${actorId}, true)`)
    return run(tx)
  })
}
