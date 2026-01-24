import { neon } from '@neondatabase/serverless'
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http'
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres'
import { env } from '@/lib/env'
import * as authSchema from './schemas/auth'
import * as mainSchema from './schemas/main'

const schema = { ...mainSchema, ...authSchema }

export const db =
  env.DB_TYPE === 'neon'
    ? drizzleNeon({ client: neon(env.DATABASE_URL), schema })
    : drizzleNode(env.DATABASE_URL, { schema })
