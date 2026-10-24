import '@tanstack/react-start/server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import { drizzleAdapter } from '@better-auth/drizzle-adapter/relations-v2'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { attachDatabasePool } from '@vercel/functions'
import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { magicLink } from 'better-auth/plugins/magic-link'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '@/lib/config/env'
import { serverEnv } from '@/lib/config/env.server'
import { withUser } from '@/lib/db'
import { relations } from '@/lib/db/relations'
import { accountsInAuth, profiles, sessionsInAuth, userRoles, verificationsInAuth } from '@/lib/db/schema'

/*
 * Better Auth, on the server only: no /api/auth route is mounted, so none of
 * its endpoints are reachable from outside. The server functions in
 * server-actions/auth.ts and hoa-board.ts call it directly (auth.api.*), and
 * tanstackStartCookies writes the session cookie it hands back.
 *
 * Its user table is profiles; sessions, passwords and one-time tokens are in
 * the auth schema (neon/migrations). It connects as vecora_auth, which can
 * read profiles and its own tables and nothing else.
 */

const pool = new Pool({ connectionString: serverEnv.DATABASE_AUTH_URL })
attachDatabasePool(pool)
const authDb = drizzle({ client: pool, relations })

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
  // Only decides whether cookies are Secure (https). The links the board shares
  // are built from the request (createInviteLink), as before.
  baseURL: env.VITE_SITE_URL,
  secret: serverEnv.BETTER_AUTH_SECRET,
  database: drizzleAdapter(authDb, {
    provider: 'pg',
    schema: {
      user: profiles,
      session: sessionsInAuth,
      account: accountsInAuth,
      verification: verificationsInAuth,
    },
  }),
  user: { fields: { name: 'fullName' } },
  session: {
    // Kept signed in for 30 days from the last visit (refreshed daily).
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // Each server function checks the session; for 5 minutes a signed cookie
    // answers instead of the database. A session ended elsewhere (password
    // change, sign-out) can live that long on another device.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
    additionalFields: {
      fromAccessLink: { type: 'boolean', required: false, defaultValue: false, input: false },
    },
  },
  // Accounts come from the board (server-actions/hoa-board.ts), never a signup.
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  databaseHooks: {
    session: {
      create: {
        before: async (session, context) => {
          // Only board members (accounts with a role) may use the app. Someone
          // taken off the board keeps their account, for history, but gets no
          // session: not from the login form, not from an old access link.
          const roles = await withUser(session.userId, (tx) =>
            tx
              .select({ role: userRoles.role })
              .from(userRoles)
              .where(eq(userRoles.userId, session.userId))
              .limit(1),
          )
          if (roles.length === 0) {
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
  },
  telemetry: { enabled: false },
  plugins: [
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

/** The signed-in session and its user, or null. Refreshes the cookie when due. */
export async function getAuthSession() {
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
