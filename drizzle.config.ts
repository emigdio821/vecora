import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'
import { withVerifiedSsl } from './src/lib/db/connection-string'

// drizzle-kit doesn't read .env files the way Vite does. Migrations run from a
// developer's machine, against the branch in .env.local.
if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local')
}

// Direct, not pooled: migrations break through Neon's pooler (see .env.example).
const url = process.env.DATABASE_URL_UNPOOLED
if (!url) {
  throw new Error('DATABASE_URL_UNPOOLED is missing (see .env.example)')
}

// The TypeScript schema is the source of truth: `npm run db:generate` turns a
// change into a migration in drizzle/, `npm run db:migrate` applies them.
// Never `drizzle-kit push`: it would drop what the custom migration adds
// (the exclusion constraints, the audit trigger), which the schema can't declare.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle',
  dbCredentials: { url: withVerifiedSsl(url) },
})
