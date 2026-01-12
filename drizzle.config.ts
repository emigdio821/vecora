import { defineConfig } from 'drizzle-kit'
import { env } from '@/lib/env'

export default defineConfig({
  out: './drizzle',
  schema: ['./src/db/schemas/main.ts', './src/db/schemas/auth.ts'],
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
})
