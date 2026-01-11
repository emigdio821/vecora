import { config } from 'dotenv'
import { z } from 'zod'

config({ path: ['.env.local', '.env'] })

const envSchema = z.object({
  DATABASE_URL: z.url().min(1, 'DATABASE_URL is required'),
})

export const env = envSchema.parse(process.env)
