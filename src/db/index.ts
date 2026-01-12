import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '@/lib/env'
import * as authSchema from './schemas/auth'
import * as mainSchema from './schemas/main'

export const db = drizzle(env.DATABASE_URL, { schema: { ...mainSchema, ...authSchema } })
