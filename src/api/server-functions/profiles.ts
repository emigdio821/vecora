import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import type { ProfileWithAllRelations } from '@/db/schemas/zod/profiles'
import { authMiddleware } from '@/middleware/auth'

export const getProfilesList = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const profiles = await db.query.profiles.findMany({
      with: {
        owner: true,
        externalUser: true,
        profileRoles: {
          with: {
            role: true,
          },
        },
        user: true,
      },
      orderBy: (profiles, { desc }) => [desc(profiles.updatedAt)],
    })

    return profiles satisfies ProfileWithAllRelations[]
  })
