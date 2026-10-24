import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'
import { type ActionResult, databaseError, postgrestErrorMessage } from '@/lib/action-result'
import { authMiddleware } from '@/lib/auth/middleware'
import { getSessionUserId, withCurrentUser } from '@/lib/db/current-user'
import { profiles } from '@/lib/db/schema'
import { m } from '@/paraglide/messages'

/** The welcome dialog was closed: don't open it by itself again, on any device. */
const markWelcomedFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async (): Promise<ActionResult> => {
    const userId = await getSessionUserId()
    if (!userId) {
      return { error: m.common_no_permission() }
    }

    try {
      await withCurrentUser((tx) =>
        tx
          .update(profiles)
          .set({ welcomedAt: new Date() })
          .where(and(eq(profiles.id, userId), isNull(profiles.welcomedAt))),
      )
    } catch (error) {
      return {
        error: postgrestErrorMessage(databaseError(error), { fallback: m.settings_generic_save_failed() }),
      }
    }

    return { data: undefined }
  })

export const markWelcomed = () => markWelcomedFn()
