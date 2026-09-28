import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface Settings {
  /** Empty when the president hasn't set one yet. */
  residentialName: string
}

/**
 * The single public.settings row, read once per request (the authed layout
 * hands it down). Reports can call this too. A read failure falls back to
 * empty values so the app still renders with its generic labels.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('residential_name').maybeSingle()

  return { residentialName: data?.residential_name ?? '' }
})
