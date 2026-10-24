import '@tanstack/react-start/server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { admin } from 'better-auth/plugins/admin'
import { magicLink } from 'better-auth/plugins/magic-link'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { env } from '@/lib/config/env'
import { serverEnv } from '@/lib/config/env.server'
import { db } from '@/lib/db'
import { ac, roles } from './permissions'
import { parseRoles } from './roles'

/*
 * Better Auth, on Better Auth's own tables (src/lib/db/schema/auth.ts).
 *
 *   * Signing in and out goes through its HTTP handler (src/routes/api/auth/$.ts),
 *     which only lets those few endpoints through, so its rate limiter guards
 *     the password form. Everything else (access links, choosing a password,
 *     the main admin's password) is called from server functions (auth.api.*).
 *   * Accounts come from the board (src/lib/services/board.ts), never a signup.
 *   * Roles are the admin plugin's users.role; what each may do is in
 *     ./permissions.ts.
 */

/** What the invite dialog promises ("expires in 1 hour"). */
const ACCESS_LINK_SECONDS = 60 * 60

/** Code of the error a sign-in gets when the account holds no role. */
export const NOT_ON_THE_BOARD = 'NOT_ON_THE_BOARD'

/** The path of the endpoint that spends an access link (see confirmAccessLink). */
const ACCESS_LINK_PATH = '/magic-link/verify'

// Where createAccessToken() picks up the token Better Auth just stored. Per
// call, so two links issued at once never swap.
const issuedTokens = new AsyncLocalStorage<{ token?: string }>()

export const auth = betterAuth({
  appName: 'Vecora',
  baseURL: env.VITE_SITE_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  // The relations carry the tables; usePlural maps its models (user, session...) to them.
  database: drizzleAdapter(db, { provider: 'pg', usePlural: true }),
  user: {
    additionalFields: {
      isMainAdmin: { type: 'boolean', required: false, defaultValue: false, input: false },
      mustChangePassword: { type: 'boolean', required: false, defaultValue: false, input: false },
      welcomedAt: { type: 'date', required: false, input: false },
    },
  },
  session: {
    // Kept signed in for 30 days from the last visit (refreshed daily).
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // No cookie cache: every request reads the session and its user from the
    // database, so a role taken away or a session ended elsewhere (a new
    // password) counts from the next request.
    cookieCache: { enabled: false },
    additionalFields: {
      fromAccessLink: { type: 'boolean', required: false, defaultValue: false, input: false },
    },
  },
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  // In the database: each Vercel function instance would keep its own count
  // in memory. On by default in production only; sign-in allows 3 tries per
  // 10 seconds per address.
  rateLimit: { storage: 'database' },
  databaseHooks: {
    session: {
      create: {
        before: async (session, context) => {
          // Only board members (accounts with a role) may use the app. Someone
          // taken off the board keeps their account, for history, but gets no
          // session: not from the sign-in form, not from an old access link.
          const user = await db.query.users.findFirst({
            columns: { role: true },
            where: { id: session.userId },
          })
          if (parseRoles(user?.role).length === 0) {
            throw APIError.from('FORBIDDEN', { code: NOT_ON_THE_BOARD, message: 'The account holds no role' })
          }

          // An access link's session may only choose a password (see CurrentUser.mustSetPassword).
          return { data: { ...session, fromAccessLink: context?.path === ACCESS_LINK_PATH } }
        },
      },
    },
  },
  advanced: {
    cookiePrefix: 'vecora',
    database: { generateId: 'uuid' },
    // Vercel puts the visitor's address here; the rate limiter counts by it.
    ipAddress: { ipAddressHeaders: ['x-vercel-forwarded-for', 'x-forwarded-for'] },
  },
  telemetry: { enabled: false },
  plugins: [
    // Its "user" default isn't one of ours: an account it creates holds no role
    // until the board gives it one.
    admin({ ac, roles, defaultRole: '' }),
    // The access links: a one-time token that opens a session. Nothing is
    // emailed; createAccessToken() hands the token to the board to share.
    magicLink({
      disableSignUp: true,
      expiresIn: ACCESS_LINK_SECONDS,
      // Only a hash in the database, so reading it gives no one a usable link.
      storeToken: 'hashed',
      sendMagicLink: ({ token }) => {
        const issued = issuedTokens.getStore()
        if (!issued) {
          throw new Error('Access links are only issued through createAccessToken()')
        }
        issued.token = token
      },
    }),
    // Last, as Better Auth asks: it copies the other plugins' cookies too.
    tanstackStartCookies(),
  ],
})

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

/** The signed-in session and its user, or null. Refreshes the cookie when due. */
export async function getAuthSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: getRequestHeaders() })
}

/**
 * A one-time token that opens a session for `email`'s account, valid for an
 * hour. The account must exist and hold a role, or spending it fails.
 */
export async function createAccessToken(email: string): Promise<string> {
  const issued: { token?: string } = {}
  await issuedTokens.run(issued, () =>
    auth.api.signInMagicLink({ body: { email }, headers: getRequestHeaders() }),
  )
  if (!issued.token) {
    throw new Error('Better Auth issued no access token')
  }
  return issued.token
}
