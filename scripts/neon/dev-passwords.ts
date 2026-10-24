/**
 * Gives every account on the dev branch in .env.local the seeds' password,
 * "admin", hashed the way Better Auth checks it (scrypt). Accounts that
 * already have a password keep it.
 *
 *   npm run db:neon:dev-passwords
 *
 * The seeds hash their passwords with bcrypt into Supabase's auth.users, which
 * the Better Auth migration drops, so a loaded branch has accounts but no
 * passwords. `npm run db:neon:load` runs this after the migrations. Never on
 * production: there, every account gets an access link instead.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { hashPassword } from 'better-auth/crypto'
import pg from 'pg'

const ROOT = join(import.meta.dirname, '..', '..')

/** supabase/seed.sql and supabase/seeds/dev.sql use it for every account. */
const SEED_PASSWORD = 'admin'

/** Runs in the caller's transaction. Returns how many accounts got one. */
export async function setDevPasswords(client: pg.Client): Promise<number> {
  const { rows } = await client.query<{ id: string }>(`
    select p.id
    from public.profiles p
    where not exists (
      select 1 from auth.accounts a where a.user_id = p.id and a.provider_id = 'credential'
    )
  `)

  // These accounts existed before; their passwords aren't news for the activity log.
  await client.query('alter table auth.accounts disable trigger accounts_password_audit')
  for (const { id } of rows) {
    await client.query(
      `insert into auth.accounts (user_id, account_id, provider_id, password)
       values ($1::uuid, $1::text, 'credential', $2)`,
      [id, await hashPassword(SEED_PASSWORD)],
    )
  }
  await client.query('alter table auth.accounts enable trigger accounts_password_audit')
  return rows.length
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
  if (branch === 'production') {
    throw new Error('Refusing to set test passwords on the production branch')
  }

  const client = new pg.Client({ connectionString: url })
  await client.connect()

  try {
    await client.query('begin')
    const count = await setDevPasswords(client)
    await client.query('commit')
    console.log(`Set the seeds' password on ${count} account(s) of Neon branch ${branch}`)
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}
