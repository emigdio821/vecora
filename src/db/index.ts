import { neon } from '@neondatabase/serverless'
// import { drizzle } from 'drizzle-orm/node-postgres' // for local Postgres usage
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '@/lib/env'
import * as authSchema from './schemas/auth'
import * as mainSchema from './schemas/main'

const sql = neon(env.DATABASE_URL)
export const db = drizzle({ client: sql, schema: { ...mainSchema, ...authSchema } })

// For local Postgres usage
// export const db = drizzle(env.DATABASE_URL, { schema: { ...mainSchema, ...authSchema } })
