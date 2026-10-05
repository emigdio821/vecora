import '@tanstack/react-start/server-only'
import { createClient } from '@/lib/supabase/server'
import type { CurrencyCode } from '@/lib/utils'
import { type AppLanguage, LOGO_BUCKET } from '@/lib/validations/settings'

export interface Settings {
  /** Empty when the president hasn't set one yet. */
  residentialName: string
  /** File in the logo bucket; null when there's no logo. */
  logoPath: string | null
  /** Language of the HOA's data and reports, and the app's default. */
  defaultLanguage: AppLanguage
  /** Currency of new amounts; existing rows keep their own. */
  currency: CurrencyCode
  /** The main admin completed the setup dialog. */
  isConfigured: boolean
}

/**
 * The single public.settings row (the authed layout loads it and hands it
 * down). Reports can call this too. A read failure falls back to the
 * defaults so the app still renders with its generic labels (and doesn't
 * reopen the setup dialog).
 */
export async function getSettings(): Promise<Settings> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('settings')
    .select('residential_name, logo_path, default_language, currency, configured_at')
    .maybeSingle()

  return {
    residentialName: data?.residential_name ?? '',
    logoPath: data?.logo_path ?? null,
    defaultLanguage: data?.default_language ?? 'es',
    currency: data?.currency ?? 'MXN',
    isConfigured: data ? data.configured_at !== null : true,
  }
}

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
