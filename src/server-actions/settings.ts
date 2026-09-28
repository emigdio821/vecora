'use server'

import { type ActionResult, postgrestErrorMessage } from '@/lib/action-result'
import { createClient } from '@/lib/supabase/server'
import { type SettingsInput, settingsSchema } from '@/lib/validations/settings'

/** President (or admin) edits the residential's details. RLS enforces the role. */
export async function updateSettings(input: SettingsInput): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Revisa los campos del formulario' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .update(parsed.data)
    .eq('singleton', true)
    .select('id')
    .maybeSingle()

  if (error) {
    return {
      error: postgrestErrorMessage(error, {
        fallback: 'No se pudieron guardar los ajustes, intenta nuevamente',
      }),
    }
  }
  // RLS filtered the row out: not president nor admin.
  if (!data) {
    return { error: 'No tienes permisos para realizar esta acción' }
  }

  return { data: undefined }
}
