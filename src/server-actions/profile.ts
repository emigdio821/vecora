import { createServerFn } from '@tanstack/react-start'
import { type ActionResult, postgrestErrorMessage } from '@/lib/action-result'
import { getCurrentUser } from '@/lib/supabase/current-user'
import { createClient } from '@/lib/supabase/server'

/** The welcome dialog was closed: don't open it by itself again, on any device. */
const markWelcomedFn = createServerFn({ method: 'POST' }).handler(async (): Promise<ActionResult> => {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ welcomed_at: new Date().toISOString() })
    .eq('id', user.id)
    .is('welcomed_at', null)

  if (error) {
    return { error: postgrestErrorMessage(error, { fallback: 'No se pudo guardar, intenta nuevamente' }) }
  }

  return { data: undefined }
})

export const markWelcomed = () => markWelcomedFn()
