/**
 * Loads the app's schema and test data into the Neon branch in .env.local:
 * scripts/neon/supabase-compat.sql, then every supabase/migrations file, then
 * the same seeds `npm run db:reset` runs. One transaction: it all lands, or
 * nothing does.
 *
 *   npm run db:neon:load
 *
 * Only for an empty, non-production branch. To start over, reset the branch to
 * its (empty) parent and run it again: `neon branches reset dev --parent`.
 * Then `npm run db:neon:app-role`, for the role the app connects as.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const ROOT = join(import.meta.dirname, '..', '..')

// The seeds only run where this is Supabase's local JWT secret, so they never
// touch hosted. This branch is a test database too: say so for this session.
const LOCAL_JWT_SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long'

// What Neon can't run as written. Matched exactly, so a change to these lines
// stops the load instead of being skipped by accident.
const SKIPPED = [
  {
    file: '20260921000500_settings_and_audit_log.sql',
    reason:
      "pg_cron only installs in Neon's postgres database, and only runs while the compute is awake. The nightly purge needs a scheduler of its own after the move.",
    text: `create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- 03:00 UTC daily
select cron.schedule(
  'purge-soft-deleted-registry',
  '0 3 * * *',
  $$ select private.purge_soft_deleted() $$
);`,
  },
]

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
  throw new Error('Refusing to load test data into the production branch')
}

function read(...path: string[]) {
  return readFileSync(join(ROOT, ...path), 'utf8')
}

function migration(file: string) {
  let sql = read('supabase', 'migrations', file)
  for (const skip of SKIPPED) {
    if (skip.file !== file) {
      continue
    }
    if (!sql.includes(skip.text)) {
      throw new Error(`${file} changed: the statements skipped on Neon are no longer there as written`)
    }
    sql = sql.replace(skip.text, '-- skipped on Neon (scripts/neon/load-dev.ts)')
    console.log(`  skipped part of ${file}: ${skip.reason}`)
  }
  return sql
}

const steps = [
  { name: 'scripts/neon/supabase-compat.sql', sql: read('scripts', 'neon', 'supabase-compat.sql') },
  ...readdirSync(join(ROOT, 'supabase', 'migrations'))
    .filter((file) => file.endsWith('.sql'))
    .toSorted()
    .map((file) => ({ name: `supabase/migrations/${file}`, sql: migration(file) })),
  { name: 'supabase/seed.sql', sql: read('supabase', 'seed.sql') },
  { name: 'supabase/seeds/dev.sql', sql: read('supabase', 'seeds', 'dev.sql') },
  { name: 'supabase/seeds/periods.sql', sql: read('supabase', 'seeds', 'periods.sql') },
]

const client = new pg.Client({ connectionString: url })
client.on('notice', (notice) => {
  console.log(`    ${notice.message}`)
})
await client.connect()

try {
  const existing = await client.query<{ count: string }>(
    `select count(*) from pg_tables where schemaname in ('public', 'auth', 'private')`,
  )
  if (Number(existing.rows[0].count) > 0) {
    throw new Error(
      `Branch ${branch} already has tables. Start over with: neon branches reset ${branch} --parent`,
    )
  }

  console.log(`Loading into Neon branch ${branch}`)
  await client.query('begin')
  for (const step of steps) {
    console.log(`  ${step.name}`)
    await client.query(step.sql)
    if (step.name === 'scripts/neon/supabase-compat.sql') {
      // The database default it sets applies to new sessions, not this one.
      await client.query(`set search_path = "$user", public, extensions`)
      await client.query(`select set_config('app.settings.jwt_secret', $1, false)`, [LOCAL_JWT_SECRET])
    }
  }
  await client.query('commit')
  console.log('Done')
} catch (error) {
  await client.query('rollback')
  throw error
} finally {
  await client.end()
}
