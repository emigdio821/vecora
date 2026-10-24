/**
 * Creates the main admin (admin@vecora.app) on the Neon branch in .env.local,
 * for a fresh install: the migrations make the tables but no account, and
 * without this one nobody can sign in.
 *
 *   npm run db:create-admin
 *
 * Safe on production: it refuses a branch that already has any account. The
 * password is random, printed once, and the app makes the admin replace it at
 * the first sign-in.
 */
import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createDatabase } from '../../src/lib/db/client'
import { users } from '../../src/lib/db/schema'
import { seedMainAdmin } from './seed'

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

const { db, pool } = createDatabase(url)
try {
  const existing = await db.select({ id: users.id }).from(users).limit(1)
  if (existing.length > 0) {
    throw new Error(`The ${branch} branch already has accounts; the main admin is there already`)
  }

  const password = randomBytes(12).toString('base64url')
  await seedMainAdmin(db, { password, mustChangePassword: true })
  console.log(`Created admin@vecora.app on the ${branch} branch`)
  console.log(`One-time password: ${password} (shown only now; the app asks for a new one at sign-in)`)
} finally {
  await pool.end()
}
