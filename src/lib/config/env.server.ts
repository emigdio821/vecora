import '@tanstack/react-start/server-only'
import { z } from 'zod'

const serverEnvSchema = z.object({
  /** Pooled connection string of the Neon branch. The app and Better Auth share it. */
  DATABASE_URL: z.url(),
  /** Signs Better Auth's session cookies and tokens. At least 32 characters. */
  BETTER_AUTH_SECRET: z.string().min(32),
  /** Neon Object Storage (S3-compatible) of the same branch, for the HOA logo. */
  AWS_ENDPOINT_URL_S3: z.url(),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  /** "true" during maintenance: the app answers with the maintenance page only (src/server.ts). */
  MAINTENANCE_MODE: z.stringbool().default(false),
})

const parsed = serverEnvSchema.safeParse(process.env)
if (!parsed.success) {
  throw new Error(`Invalid environment variables (see .env.example):\n${z.prettifyError(parsed.error)}`)
}

export const serverEnv = parsed.data
