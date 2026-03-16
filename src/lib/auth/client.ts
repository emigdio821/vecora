import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { ac, adminRole, maintenanceRole, presidentRole, securityRole, treasurerRole } from './permissions'

export const authClient = createAuthClient({
  plugins: [
    adminClient({
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
