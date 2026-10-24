import { createServerFn } from '@tanstack/react-start'
import { type ActionResult, errorMessage } from '@/lib/action-result'
import { sessionMiddleware } from '@/lib/auth/middleware'
import { transactionAs } from '@/lib/db'
import { markWelcomed as markUserWelcomed } from '@/lib/services/board'
import { m } from '@/paraglide/messages'

/** The welcome dialog was closed: don't open it by itself again, on any device. */
const markWelcomedFn = createServerFn({ method: 'POST' })
  .middleware([sessionMiddleware])
  .handler(async ({ context: { user } }): Promise<ActionResult> => {
    try {
      await transactionAs(user.id, (tx) => markUserWelcomed(tx, user.id))
    } catch (error) {
      return { error: errorMessage(error, { fallback: m.settings_generic_save_failed() }) }
    }

    return { data: undefined }
  })

export const markWelcomed = () => markWelcomedFn()
