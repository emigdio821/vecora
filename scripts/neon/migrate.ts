/**
 * Applies the Neon-only migrations (neon/migrations) that the branch in
 * .env.local hasn't run yet, in name order and in one transaction.
 *
 *   npm run db:neon:migrate
 *
 * supabase/migrations is what hosted Supabase runs, so changes that only make
 * sense on Neon (Better Auth's tables, for one) go here instead. A fresh load
 * (`npm run db:neon:load`) applies them too, after the seeds. Each file runs
 * once: private.neon_migrations lists the ones applied. Like supabase/migrations,
 * an applied file is never edited; a change goes in a new one.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const ROOT = join(import.meta.dirname, '..', '..')
const MIGRATIONS_DIR = join(ROOT, 'neon', 'migrations')

/** Runs in the caller's transaction. Returns the files it applied. */
export async function applyNeonMigrations(client: pg.Client): Promise<string[]> {
  await client.query(`
    create table if not exists private.neon_migrations (
      name       text primary key,
      applied_at timestamptz not null default now()
    )
  `)
  const applied = await client.query<{ name: string }>('select name from private.neon_migrations')
  const done = new Set(applied.rows.map((row) => row.name))

  const pending = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .toSorted()
    .filter((file) => !done.has(file))

  for (const file of pending) {
    console.log(`  neon/migrations/${file}`)
    await client.query(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'))
    await client.query('insert into private.neon_migrations (name) values ($1)', [file])
  }
  return pending
}

if (import.meta.main) {
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

  const client = new pg.Client({ connectionString: url })
  client.on('notice', (notice) => {
    console.log(`    ${notice.message}`)
  })
  await client.connect()

  try {
    console.log(`Migrating Neon branch ${branch}`)
    await client.query('begin')
    const applied = await applyNeonMigrations(client)
    await client.query('commit')
    console.log(applied.length > 0 ? `Applied ${applied.length}` : 'Nothing to apply')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}
