/**
 * Creates the roles the app connects as on the Neon branch in .env.local, and
 * writes their connection strings there.
 *
 *   npm run db:neon:app-role
 *
 * vecora_app (DATABASE_AUTHENTICATED_URL), for the app's queries. It logs in
 * but owns nothing, has no grants and can't bypass RLS: on its own it can't
 * read or write a single table. It can only switch to `authenticated`, which
 * withUser() does for each transaction, and there the migrations' grants and
 * `to authenticated` policies apply as they did to Supabase's signed-in users.
 * A query outside withUser() is refused.
 *
 * vecora_auth (DATABASE_AUTH_URL), for Better Auth. The Better Auth migration
 * (neon/migrations) creates it without a login and grants it the auth tables
 * and read access to the profiles; this gives it the login.
 *
 * Run it after `npm run db:neon:load` (or db:neon:migrate). When a role's URL
 * is already set (a branch reset drops the roles, not .env.local), it sets up
 * the role again with that same password. The passwords never leave this
 * process.
 */
import { randomBytes } from 'node:crypto'
import { appendFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

const ROOT = join(import.meta.dirname, '..', '..')
const ENV_FILE = join(ROOT, '.env.local')

interface AppRole {
  role: string
  envVar: string
  comment: string
  /** Created here, or by a migration (which also grants it what it needs). */
  createdBy: 'script' | 'migration'
}

const ROLES: AppRole[] = [
  {
    role: 'vecora_app',
    envVar: 'DATABASE_AUTHENTICATED_URL',
    comment: "The app's own role (scripts/neon/app-role.ts): RLS applies to every query.",
    createdBy: 'script',
  },
  {
    role: 'vecora_auth',
    envVar: 'DATABASE_AUTH_URL',
    comment: "Better Auth's role (scripts/neon/app-role.ts): sessions, accounts, tokens and profiles only.",
    createdBy: 'migration',
  },
]

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

/** The password already in .env.local, or a new one. */
function passwordFor({ role, envVar }: AppRole): { password: string; isNew: boolean } {
  const existing = process.env[envVar]
  if (!existing) {
    return { password: randomBytes(32).toString('base64url'), isNew: true }
  }
  const url = new URL(existing)
  if (url.username !== role) {
    throw new Error(`${envVar} connects as ${url.username}, expected ${role}`)
  }
  return { password: decodeURIComponent(url.password), isNew: false }
}

const client = new pg.Client({ connectionString: ownerUrl })
await client.connect()

const toWrite: Array<{ appRole: AppRole; password: string }> = []
try {
  await client.query('begin')
  for (const appRole of ROLES) {
    const { role } = appRole
    const { password, isNew } = passwordFor(appRole)
    // Statements that take a password can't use query parameters.
    const quoted = (await client.query<{ q: string }>('select quote_literal($1) as q', [password])).rows[0].q
    const found = await client.query('select 1 from pg_roles where rolname = $1', [role])

    if (found.rowCount === 0 && appRole.createdBy === 'migration') {
      throw new Error(`Role ${role} doesn't exist yet: run \`npm run db:neon:migrate\` first`)
    }
    if (found.rowCount === 0) {
      await client.query(`create role ${role} login nobypassrls password ${quoted}`)
    } else {
      await client.query(`alter role ${role} login nobypassrls password ${quoted}`)
    }
    if (role === 'vecora_app') {
      // Re-granted from scratch so a role from an earlier run gets these options too.
      await client.query(`revoke authenticated from ${role}`)
      await client.query(`grant authenticated to ${role} with inherit false, set true`)
    }
    console.log(`${found.rowCount === 0 ? 'Created' : 'Updated'} role ${role} on Neon branch ${branch}`)
    if (isNew) {
      toWrite.push({ appRole, password })
    }
  }
  await client.query('commit')
} catch (error) {
  await client.query('rollback')
  throw error
} finally {
  await client.end()
}

for (const { appRole, password } of toWrite) {
  // The pooled host, like DATABASE_URL, with this role's credentials.
  const url = new URL(pooledUrl)
  url.username = appRole.role
  // base64url: nothing to escape.
  url.password = password
  appendFileSync(ENV_FILE, `\n# ${appRole.comment}\n${appRole.envVar}=${url.toString()}\n`)
  console.log(`Wrote ${appRole.envVar} to .env.local`)
}
