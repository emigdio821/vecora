import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '@/db'
import {
  ac,
  adminRole,
  maintenanceRole,
  presidentRole,
  residentRole,
  securityRole,
  superAdminRole,
  treasurerRole,
} from './permissions'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false,
  },
  plugins: [
    tanstackStartCookies(),
    admin({
      ac,
      roles: {
        super_admin: superAdminRole,
        admin: adminRole,
        resident: residentRole,
        maintenance: maintenanceRole,
        president: presidentRole,
        security: securityRole,
        treasurer: treasurerRole,
      },
    }),
  ],
})

export type Session = typeof auth.$Infer.Session
export type SessionUser = typeof auth.$Infer.Session.user
