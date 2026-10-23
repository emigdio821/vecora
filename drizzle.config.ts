import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

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

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
})
