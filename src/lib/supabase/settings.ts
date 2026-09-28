import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { LOGO_BUCKET } from '@/lib/validations/settings'

export interface Settings {
  /** Empty when the president hasn't set one yet. */
  residentialName: string
  /** File in the logo bucket; null when there's no logo. */
  logoPath: string | null
}

/**
 * The single public.settings row, read once per request (the authed layout
 * hands it down). Reports can call this too. A read failure falls back to
 * empty values so the app still renders with its generic labels.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('residential_name, logo_path').maybeSingle()

  return { residentialName: data?.residential_name ?? '', logoPath: data?.logo_path ?? null }
})

/** The logo's PNG bytes, for the report. Null when it can't be read: the report goes without it. */
export async function getLogo(path: string): Promise<Buffer | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(LOGO_BUCKET).download(path)
  if (error) {
    console.error('logo download failed', error)
    return null
  }

  return Buffer.from(await data.arrayBuffer())
}
