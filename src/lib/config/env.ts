import { z } from 'zod'

const envSchema = z.object({
  /** Where the app is deployed, for the absolute URLs link previews need (and Better Auth's secure cookies). */
  VITE_SITE_URL: z.url(),
})

const parsed = envSchema.safeParse(import.meta.env)
if (!parsed.success) {
  throw new Error(`Invalid environment variables (see .env.example):\n${z.prettifyError(parsed.error)}`)
}

export const env = parsed.data
