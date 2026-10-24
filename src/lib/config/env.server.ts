import '@tanstack/react-start/server-only'
import { z } from 'zod'

const serverEnvSchema = z.object({
  /** Pooled connection string of the app's own role (scripts/neon/app-role.ts), which can't bypass RLS. */
  DATABASE_AUTHENTICATED_URL: z.url(),
  /** Pooled connection string of Better Auth's role (scripts/neon/app-role.ts): auth tables and profiles only. */
  DATABASE_AUTH_URL: z.url(),
  /** Signs Better Auth's session cookies and tokens. At least 32 characters. */
  BETTER_AUTH_SECRET: z.string().min(32),
  /** Neon Object Storage (S3-compatible) of the same branch, for the HOA logo. */
  AWS_ENDPOINT_URL_S3: z.url(),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
})

const parsed = serverEnvSchema.safeParse(process.env)
if (!parsed.success) {
  throw new Error(`Invalid environment variables (see .env.example):\n${z.prettifyError(parsed.error)}`)
}

export const serverEnv = parsed.data
