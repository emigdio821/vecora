/**
 * Empties the Neon branch in .env.local, applies every migration in drizzle/
 * and loads the test data (scripts/db/seed.ts).
 *
 *   npm run db:reset           schema + test data
 *   npm run db:reset -- --empty  schema + the main admin only
 *
 * Only for a development branch: it refuses NEON_BRANCH=production, and it
 * drops every schema the app's tables live in.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'
import { createDatabase } from '../../src/lib/db/client'
import { withVerifiedSsl } from '../../src/lib/db/connection-string'
import { seed, seedMainAdmin } from './seed'

const ROOT = join(import.meta.dirname, '..', '..')

if (existsSync(join(ROOT, '.env.local'))) {
  process.loadEnvFile(join(ROOT, '.env.local'))
}

const branch = process.env.NEON_BRANCH
const url = process.env.DATABASE_URL_UNPOOLED
if (!branch || !url) {
  throw new Error(
    'NEON_BRANCH and DATABASE_URL_UNPOOLED must be set (.env.local, from `neon checkout <branch>`)',
  )
}
if (branch === 'production') {
  throw new Error('Refusing to reset the production branch')
}

const onlyAdmin = process.argv.includes('--empty')

// Everything but Postgres's own schemas: the app's tables, the activity log's
// functions and drizzle's record of the migrations it applied.
const client = new pg.Client({ connectionString: withVerifiedSsl(url) })
await client.connect()
const { rows } = await client.query<{ name: string }>(`
  select nspname as name from pg_namespace
  where nspname not like 'pg\\_%' and nspname <> 'information_schema'
`)
for (const { name } of rows) {
  await client.query(`drop schema ${pg.escapeIdentifier(name)} cascade`)
}
await client.query('create schema public')
await client.end()
console.log(`Emptied the ${branch} branch`)

const { db, pool } = createDatabase(url)
try {
  await migrate(db, { migrationsFolder: join(ROOT, 'drizzle') })
  console.log('Applied the migrations')

  if (onlyAdmin) {
    await seedMainAdmin(db, { password: 'admin', mustChangePassword: false })
    console.log('Created admin@vecora.app (password "admin")')
  } else {
    console.log('Loading the test data (about a minute)…')
    await seed(db)
  }
} finally {
  await pool.end()
}
