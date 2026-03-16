import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { db } from '@/db'
import { ac, adminRole, maintenanceRole, presidentRole, securityRole, treasurerRole } from './permissions'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
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
        admin: adminRole,
        maintenance: maintenanceRole,
        president: presidentRole,
        security: securityRole,
        treasurer: treasurerRole,
      },
    }),
  ],
})
