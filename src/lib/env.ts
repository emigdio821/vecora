// import { config } from 'dotenv'
import { z } from 'zod'

// config({ path: ['.env.local', '.env'], quiet: true })

const envSchema = z.object({
  DATABASE_URL: z.url().min(1, 'DATABASE_URL is required'),
  DB_TYPE: z.enum(['local', 'neon']).default('local'),
})

export const env = envSchema.parse(process.env)
