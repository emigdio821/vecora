import '@tanstack/react-start/server-only'
import { z } from 'zod'

const serverEnvSchema = z.object({
  /** Service-role key, for the Auth Admin API (adding and removing board members). */
  SUPABASE_SECRET_KEY: z.string().min(1),
  /** "true" while the data moves: the app answers with the maintenance page only (src/server.ts). */
  MAINTENANCE_MODE: z.stringbool().default(false),
})

const parsed = serverEnvSchema.safeParse(process.env)
if (!parsed.success) {
  throw new Error(`Invalid environment variables (see .env.example):\n${z.prettifyError(parsed.error)}`)
}

export const serverEnv = parsed.data
