/**
 * Creates the role the app connects as on the Neon branch in .env.local, and
 * writes its connection string there as DATABASE_AUTHENTICATED_URL.
 *
 *   npm run db:neon:app-role
 *
 * The role logs in but owns nothing, has no grants and can't bypass RLS: on its
 * own it can't read or write a single table. It can only switch to
 * `authenticated`, which withUser() does for each transaction, and there the
 * migrations' grants and `to authenticated` policies apply as they did to
 * Supabase's signed-in users. A query outside withUser() is refused.
 *
 * Run it after `npm run db:neon:load`. When DATABASE_AUTHENTICATED_URL is
 * already set (a branch reset drops the role, not .env.local), it recreates
 * the role with that same password. The password never leaves this process.
 */
import { randomBytes } from 'node:crypto'
import { appendFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const ROOT = join(import.meta.dirname, '..', '..')
const ENV_FILE = join(ROOT, '.env.local')
const ROLE = 'vecora_app'

if (existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE)
}

const branch = process.env.NEON_BRANCH
const ownerUrl = process.env.DATABASE_URL_UNPOOLED
const pooledUrl = process.env.DATABASE_URL
if (!branch || !ownerUrl || !pooledUrl) {
  throw new Error(
    'NEON_BRANCH, DATABASE_URL and DATABASE_URL_UNPOOLED must be set (.env.local, from `neon checkout <branch>`)',
  )
}

let password = ''
const existing = process.env.DATABASE_AUTHENTICATED_URL
if (existing) {
  const url = new URL(existing)
  if (url.username !== ROLE) {
    throw new Error(`DATABASE_AUTHENTICATED_URL connects as ${url.username}, expected ${ROLE}`)
  }
  password = decodeURIComponent(url.password)
} else {
  password = randomBytes(32).toString('base64url')
}

const client = new pg.Client({ connectionString: ownerUrl })
await client.connect()

try {
  // Statements that take a password can't use query parameters.
  const quoted = (await client.query<{ q: string }>('select quote_literal($1) as q', [password])).rows[0].q
  const found = await client.query('select 1 from pg_roles where rolname = $1', [ROLE])

  await client.query('begin')
  if (found.rowCount === 0) {
    await client.query(`create role ${ROLE} login nobypassrls password ${quoted}`)
  } else {
    await client.query(`alter role ${ROLE} login nobypassrls password ${quoted}`)
  }
  // Re-granted from scratch so a role from an earlier run gets these options too.
  await client.query(`revoke authenticated from ${ROLE}`)
  await client.query(`grant authenticated to ${ROLE} with inherit false, set true`)
  await client.query('commit')
  console.log(`${found.rowCount === 0 ? 'Created' : 'Updated'} role ${ROLE} on Neon branch ${branch}`)
} catch (error) {
  await client.query('rollback')
  throw error
} finally {
  await client.end()
}

if (!existing) {
  // The pooled host, like DATABASE_URL, with this role's credentials.
  const url = new URL(pooledUrl)
  url.username = ROLE
  // base64url: nothing to escape.
  url.password = password
  appendFileSync(
    ENV_FILE,
    `\n# The app's own role (scripts/neon/app-role.ts): RLS applies to every query.\nDATABASE_AUTHENTICATED_URL=${url.toString()}\n`,
  )
  console.log('Wrote DATABASE_AUTHENTICATED_URL to .env.local')
}
